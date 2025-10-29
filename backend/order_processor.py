import json
import os
import boto3
import time
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')
session = boto3.Session()
credentials = session.get_credentials()

# Get environment variables set by Terraform
TOKEN_CACHE_TABLE_NAME = os.environ.get('TOKEN_CACHE_TABLE')
CLIENT_ID_PARAM_DEV = os.environ.get('CLIENT_ID_PARAM_DEV')
CLIENT_SECRET_PARAM_DEV = os.environ.get('CLIENT_SECRET_PARAM_DEV')
MENU_TABLE_NAME = os.environ.get('MENU_TABLE')
ORDERS_TABLE_NAME = os.environ.get('ORDERS_TABLE')
APPSYNC_API_URL = os.environ.get('APPSYNC_API_URL')
AWS_REGION = os.environ.get('AWS_REGION')

# Initialize DynamoDB Table resources
token_cache_table = dynamodb.Table(TOKEN_CACHE_TABLE_NAME)
menu_table = dynamodb.Table(MENU_TABLE_NAME)
orders_table = dynamodb.Table(ORDERS_TABLE_NAME)

def get_uber_eats_token():
    """
    Retrieves a valid Uber Eats API token, using a cache to avoid rate limits.
    """
    try:
        cached_item = token_cache_table.get_item(Key={'ProviderName': 'UberEats'}).get('Item')
        if cached_item and cached_item.get('ExpiresAt') > time.time():
            print("Found valid token in cache.")
            return cached_item.get('AccessToken')
    except Exception as e:
        print(f"Could not read from token cache: {e}")

    print("No valid token in cache. Requesting a new one.")
    
    params = ssm.get_parameters(
        Names=[CLIENT_ID_PARAM_DEV, CLIENT_SECRET_PARAM_DEV],
        WithDecryption=True
    )
    
    creds = {p['Name']: p['Value'] for p in params['Parameters']}
    client_id = creds[CLIENT_ID_PARAM_DEV]
    client_secret = creds[CLIENT_SECRET_PARAM_DEV]

    auth_url = "https://auth.uber.com/oauth/v2/token"
    auth_payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
        'scope': 'eats.order eats.store' 
    }
    
    response = requests.post(auth_url, data=auth_payload)
    print("auth payload:", auth_payload)
    response.raise_for_status()
    token_data = response.json()
    print("token_data:", token_data)
    access_token = token_data['access_token']
    expires_in = token_data['expires_in']
    
    expires_at = int(time.time()) + expires_in - 300
    
    token_cache_table.put_item(
        Item={
            'ProviderName': 'UberEats',
            'AccessToken': access_token,
            'ExpiresAt': expires_at
        }
    )
    
    return access_token

def accept_uber_eats_order(order_id, auth_token, ready_for_pickup_time=None, external_reference_id=None, accepted_by=None):
    """
    Sends the POST /accept request to Uber Eats API.
    """
    accept_url = f"https://api.uber.com/v1/delivery/order/{order_id}/accept"
    
    payload = {}
    if ready_for_pickup_time:
        payload["ready_for_pickup_time"] = ready_for_pickup_time
    if external_reference_id:
        payload["external_reference_id"] = external_reference_id
    if accepted_by:
        payload["accepted_by"] = accepted_by
    
    headers = {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"Attempting to accept order {order_id}...")
        if payload:
            response = requests.post(accept_url, headers=headers, data=json.dumps(payload))
        else:
            response = requests.post(accept_url, headers=headers)
        response.raise_for_status()
        print(f"Successfully accepted order {order_id}.")
        return True
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error accepting order {order_id}: {http_err}. Response: {response.text}")
        return False
    except Exception as e:
        print(f"Generic error accepting order {order_id}: {e}")
        return False


def push_order_to_appsync(order_data):
    """
    Signs and sends a GraphQL mutation to the AppSync API.
    """
    print(f"Pushing filtered order to AppSync: {json.dumps(order_data)}")
    
    mutation = """
        mutation NewOrder($order: AWSJSON!) {
            newOrder(order: $order) {
                OrderID
                DisplayID
                State
            }
        }
    """
    
    payload = {
        "query": mutation,
        "variables": {
            "order": json.dumps(order_data)
        }
    }

    request = AWSRequest(
        method="POST",
        url=APPSYNC_API_URL,
        data=json.dumps(payload),
        headers={'Content-Type': 'application/json'}
    )
    SigV4Auth(credentials, "appsync", AWS_REGION).add_auth(request)

    response = requests.post(APPSYNC_API_URL, headers=dict(request.headers), data=request.data)
    response.raise_for_status()
    
    print("Successfully pushed order to AppSync.")
    print(response.json())


def handler(event, context):
    """
    This function is triggered by SQS. It processes orders in the following sequence:
    1. Get auth token (from cache or Uber)
    2. Accept the order immediately
    3. Fetch full order details
    4. Apply business logic (filter back-of-house items)
    5. Push to frontend via AppSync if applicable
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event['Records']:
        webhook_payload = json.loads(record['body'])
        order_href = webhook_payload.get('resource_href')
        
        if not order_href:
            print("No resource_href found in payload. Skipping.")
            continue
            
        # Extract order ID from the resource_href for the accept call
        # Assuming format: https://api.uber.com/v1/eats/order/{order_id}
        order_id = order_href.split('/')[-1]
        
        try:
            # Step 1: Get authentication token (from cache or fresh)
            print("Step 1: Getting authentication token...")
            auth_token = get_uber_eats_token()
            
            # Step 2: Accept the order immediately
            print(f"Step 2: Accepting order {order_id}...")
            accept_result = accept_uber_eats_order(order_id, auth_token)
            if not accept_result:
                print(f"Warning: Failed to accept order {order_id}. Continuing with processing...")
            
            # Step 3: Fetch full order details
            print(f"Step 3: Fetching full order details from {order_href}...")
            headers = {'Authorization': f'Bearer {auth_token}'}
            order_response = requests.get(order_href, headers=headers)
            order_response.raise_for_status()
            order_details = order_response.json()
            
            print("Successfully fetched order details.")
            print(f"Order Details: {json.dumps(order_details, indent=2)}")
            
            # Step 4: Apply business logic - Enrich and filter for back-of-house items
            print("Step 4: Filtering for back-of-house items...")
            back_of_house_items = []
            
            # Get the cart from the order (note: it's "cart" singular, not "carts")
            cart = order_details.get("cart", {})
            if cart:
                for item in cart.get("items", []):
                    # Query the GSI to find our internal menu item by the Uber Eats ID
                    response = menu_table.query(
                        IndexName='UberEatsID-index',
                        KeyConditionExpression=boto3.dynamodb.conditions.Key('UberEatsID').eq(item.get('id'))
                    )
                    
                    if response['Items']:
                        menu_item = response['Items'][0]
                        # Check if the item's location is 'back' or 'both'
                        if menu_item.get('Location') in ['back', 'both']:
                            back_of_house_items.append({
                                'Title': menu_item.get('NameMandarin', item.get('title')),
                                'Quantity': item.get('quantity', {}).get('default_quantity', {}).get('amount', 1),
                                'SpecialInstructions': item.get('customer_request', {}).get('special_instructions', '')
                            })

            # Step 5: If back-of-house items found, save and push to frontend
            if back_of_house_items:
                print(f"Found {len(back_of_house_items)} back-of-house items for order {order_id}.")
                
                filtered_order = {
                    'OrderID': order_details.get('id'),
                    'DisplayID': order_details.get('display_id'),
                    'State': order_details.get('state'),
                    'Items': back_of_house_items
                }
                
                # Save the filtered order to our Orders table for tracking/history
                print("Saving filtered order to DynamoDB...")
                orders_table.put_item(Item=filtered_order)
                
                # Push to AppSync for real-time frontend updates
                print("Step 5: Pushing to AppSync...")
                push_order_to_appsync(filtered_order)
                
                print(f"Order {order_id} processing complete.")
            else:
                print(f"No back-of-house items found for order {order_id}. Order accepted but not pushed to frontend.")

        except Exception as e:
            print(f"Failed to process order {order_href}. Error: {e}")
            # Note: We're raising the exception so SQS will retry if needed
            raise e
            
    return {'status': 'success'}