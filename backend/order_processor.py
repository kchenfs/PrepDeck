import json
import os
import boto3
import time
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from datetime import datetime
from boto3.dynamodb.conditions import Key

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
        payload["accepted__by"] = accepted_by
    
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
    Returns the response data for logging.
    """
    print(f"=== APPSYNC PUSH START ===")
    print(f"Pushing filtered order to AppSync:")
    print(json.dumps(order_data, indent=2))
    
    mutation = """
        mutation NewOrder($order: OrderInput!) {
            newOrder(order: $order) {
                OrderID
                DisplayID
                State
                Items
                SpecialInstructions
            }
        }
    """
    
    # FIXED: Convert Items to JSON string since it's AWSJSON type
    order_input = {
        "OrderID": order_data["OrderID"],
        "DisplayID": order_data["DisplayID"],
        "State": order_data["State"],
        "Items": json.dumps(order_data["Items"]),  # Convert to JSON string
        "SpecialInstructions": order_data["SpecialInstructions"]
    }
    
    payload = {
        "query": mutation,
        "variables": {
            "order": order_input
        }
    }

    print(f"GraphQL Payload being sent:")
    print(json.dumps(payload, indent=2))

    request = AWSRequest(
        method="POST",
        url=APPSYNC_API_URL,
        data=json.dumps(payload),
        headers={'Content-Type': 'application/json'}
    )
    SigV4Auth(credentials, "appsync", AWS_REGION).add_auth(request)

    print(f"Signed request headers: {dict(request.headers)}")

    response = requests.post(APPSYNC_API_URL, headers=dict(request.headers), data=request.data)
    
    print(f"AppSync Response Status: {response.status_code}")
    print(f"AppSync Response Body:")
    print(json.dumps(response.json(), indent=2))
    
    response.raise_for_status()
    
    response_data = response.json()
    
    # Check if there were any errors
    if 'errors' in response_data:
        print(f"⚠️  AppSync returned errors: {response_data['errors']}")
    
    # Check if data was successfully sent
    if 'data' in response_data and response_data['data'] and response_data['data'].get('newOrder'):
        print(f"✅ Successfully pushed order to AppSync!")
        print(f"Returned Order Data: {json.dumps(response_data['data']['newOrder'], indent=2)}")
    else:
        print(f"⚠️  AppSync mutation returned None - check resolver configuration")
    
    print(f"=== APPSYNC PUSH END ===")
    
    return response_data

def handler(event, context):
    """
    This function is triggered by SQS. It processes orders in the following sequence:
    1. Get auth token (from cache or Uber)
    2. Accept the order immediately
    3. Fetch full order details
    4. Apply business logic (filter items and ALL modifiers)
    5. Push to frontend via AppSync if applicable
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event['Records']:
        webhook_payload = json.loads(record['body'])
        order_href = webhook_payload.get('resource_href')
        
        if not order_href:
            print("No resource_href found in payload. Skipping.")
            continue
            
        # Extract order ID from the resource_href
        order_id = order_href.split('/')[-1]
        
        try:
            # Step 1: Get authentication token
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
            
            print(f"Full order details fetched: {json.dumps(order_details)}")
            
            # Step 4: Apply business logic - Enrich and filter for back-of-house items
            print("Step 4: Filtering for back-of-house items...")
            back_of_house_items = []
            
            cart = order_details.get("cart", {})
            if cart:
                for item in cart.get("items", []):
                    # Query the GSI for the MAIN item
                    response = menu_table.query(
                        IndexName='UberEatsID-index', 
                        KeyConditionExpression=Key('UberEatsID').eq(item.get('id'))
                    )
                    
                    if response['Items']:
                        menu_item = response['Items'][0]
                        
                        # Check if the item's location is 'back' or 'both'
                        if menu_item.get('Location') in ['back', 'both']:
                            
                            # Build the main item object
                            processed_item = {
                                'Title': menu_item.get('name_mandarin', menu_item.get('ItemName', item.get('title'))),
                                'InternalSKU': menu_item.get('ItemID'),
                                'Quantity': item.get('quantity', 1),
                                'SpecialInstructions': item.get('special_instructions', ''), 
                                'Modifiers': []
                            }

                            # --- Process ALL Modifiers ---
                            if item.get('selected_modifier_groups'):
                                for group in item.get('selected_modifier_groups'):
                                    for modifier in group.get('selected_items', []): 
                                        # Query the GSI for the MODIFIER item
                                        modifier_response = menu_table.query(
                                            IndexName='UberEatsID-index', 
                                            KeyConditionExpression=Key('UberEatsID').eq(modifier.get('id'))
                                        )
                                        
                                        if modifier_response['Items']:
                                            modifier_item_details = modifier_response['Items'][0]
                                            
                                            # Add this modifier to the list
                                            processed_item['Modifiers'].append({
                                                'Title': modifier_item_details.get('name_mandarin', modifier_item_details.get('ItemName', modifier.get('title'))),
                                                'InternalSKU': modifier_item_details.get('ItemID'),
                                                'Quantity': modifier.get('quantity', 1)
                                            })
                                        else:
                                            print(f"Warning: Modifier item {modifier.get('id')} not found in menu_table.")
                            
                            back_of_house_items.append(processed_item)
                            
                    else:
                        print(f"Warning: Main item {item.get('id')} not found in menu_table.")

            # Step 5: If back-of-house items found, save and push to frontend
            if back_of_house_items:
                print(f"Found {len(back_of_house_items)} back-of-house items for order {order_id}.")
                
                cart_special_instructions = cart.get('special_instructions', '')
                
                filtered_order = {
                    'OrderID': order_details.get('id'),
                    'DisplayID': order_details.get('display_id'),
                    'State': order_details.get('current_state'), 
                    'Items': back_of_house_items,
                    'SpecialInstructions': cart_special_instructions
                }
                
                # Save the filtered order to our Orders table
                print("Saving filtered order to DynamoDB...")
                orders_table.put_item(Item=filtered_order)
                
                # Push to AppSync for real-time frontend updates
                print("Step 5: Pushing to AppSync...")
                appsync_response = push_order_to_appsync(filtered_order)
                
                print(f"Order {order_id} processing complete.")
            else:
                print(f"No back-of-house items found for order {order_id}. Order accepted but not pushed to frontend.")

        except Exception as e:
            print(f"Failed to process order {order_href}. Error: {e}")
            import traceback
            print(traceback.format_exc())
            raise e
            
    return {'status': 'success'}