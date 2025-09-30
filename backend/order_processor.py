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
CLIENT_ID_PARAM_NAME = os.environ.get('CLIENT_ID_PARAM')
CLIENT_SECRET_PARAM_NAME = os.environ.get('CLIENT_SECRET_PARAM')
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
        Names=[CLIENT_ID_PARAM_NAME, CLIENT_SECRET_PARAM_NAME],
        WithDecryption=True
    )
    
    creds = {p['Name']: p['Value'] for p in params['Parameters']}
    client_id = creds[CLIENT_ID_PARAM_NAME]
    client_secret = creds[CLIENT_SECRET_PARAM_NAME]

    auth_url = "https://auth.uber.com/oauth/v2/token"
    auth_payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
        'scope': 'eats.order eats.store' 
    }
    
    response = requests.post(auth_url, data=auth_payload)
    response.raise_for_status()
    token_data = response.json()
    
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
    This function is triggered by SQS. It fetches, enriches, filters, and pushes orders.
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event['Records']:
        webhook_payload = json.loads(record['body'])
        order_href = webhook_payload.get('resource_href')
        
        if not order_href:
            print("No resource_href found in payload. Skipping.")
            continue
            
        try:
            auth_token = get_uber_eats_token()
            
            headers = {'Authorization': f'Bearer {auth_token}'}
            order_response = requests.get(order_href, headers=headers)
            order_response.raise_for_status()
            order_details = order_response.json().get("order", {})
            
            print("Successfully fetched order details.")
            
            # Step 3: Enrich the order with data from the Menu table
            back_of_house_items = []
            
            for cart in order_details.get("carts", []):
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
                                'Title': menu_item.get('NameMandarin', item.get('title')), # Use Mandarin name, fallback to original
                                'Quantity': item.get('quantity', {}).get('default_quantity', {}).get('amount', 1),
                                'SpecialInstructions': item.get('customer_request', {}).get('special_instructions', '')
                            })

            # Step 4: If any back-of-house items were found, save and push the order
            if back_of_house_items:
                print(f"Found {len(back_of_house_items)} back-of-house items for order {order_details.get('id')}.")
                
                filtered_order = {
                    'OrderID': order_details.get('id'),
                    'DisplayID': order_details.get('display_id'),
                    'State': order_details.get('state'),
                    'Items': back_of_house_items
                }
                
                # Save the filtered order to our Orders table for tracking/history
                orders_table.put_item(Item=filtered_order)
                
                # Step 5: Make a mutation to AppSync to push to the frontend
                push_order_to_appsync(filtered_order)
            else:
                print(f"No back-of-house items found for order {order_details.get('id')}. Skipping.")

        except Exception as e:
            print(f"Failed to process order {order_href}. Error: {e}")
            raise e
            
    return {'status': 'success'}

