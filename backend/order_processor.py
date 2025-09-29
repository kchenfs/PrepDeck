import json
import os
import boto3
import time
import requests # This will be installed from requirements.txt

# Initialize AWS clients
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')

# Get environment variables set by Terraform
TOKEN_CACHE_TABLE_NAME = os.environ.get('TOKEN_CACHE_TABLE')
CLIENT_ID_PARAM_NAME = os.environ.get('CLIENT_ID_PARAM')
CLIENT_SECRET_PARAM_NAME = os.environ.get('CLIENT_SECRET_PARAM')
MENU_TABLE_NAME = os.environ.get('MENU_TABLE')
ORDERS_TABLE_NAME = os.environ.get('ORDERS_TABLE')

token_cache_table = dynamodb.Table(TOKEN_CACHE_TABLE_NAME)

def get_uber_eats_token():
    """
    Retrieves a valid Uber Eats API token, using a cache to avoid rate limits.
    If the token is expired or not in the cache, it requests a new one.
    """
    # 1. Check cache for a valid token
    try:
        cached_item = token_cache_table.get_item(Key={'ProviderName': 'UberEats'}).get('Item')
        if cached_item and cached_item.get('ExpiresAt') > time.time():
            print("Found valid token in cache.")
            return cached_item.get('AccessToken')
    except Exception as e:
        print(f"Could not read from token cache: {e}")

    # 2. If no valid token, fetch credentials and get a new one
    print("No valid token in cache. Requesting a new one.")
    
    # Fetch credentials securely from Parameter Store
    params = ssm.get_parameters(
        Names=[CLIENT_ID_PARAM_NAME, CLIENT_SECRET_PARAM_NAME],
        WithDecryption=True
    )
    
    creds = {p['Name']: p['Value'] for p in params['Parameters']}
    client_id = creds[CLIENT_ID_PARAM_NAME]
    client_secret = creds[CLIENT_SECRET_PARAM_NAME]

    # Make OAuth request to Uber Eats
    auth_url = "https://auth.uber.com/oauth/v2/token"
    auth_payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
        'scope': 'eats.order eats.store' 
    }
    
    response = requests.post(auth_url, data=auth_payload)
    response.raise_for_status() # Will raise an error for non-200 responses
    token_data = response.json()
    
    access_token = token_data['access_token']
    expires_in = token_data['expires_in']
    
    # 3. Save the new token to the cache for future use
    expires_at = int(time.time()) + expires_in - 300 # Subtract 5 mins for safety buffer
    
    token_cache_table.put_item(
        Item={
            'ProviderName': 'UberEats',
            'AccessToken': access_token,
            'ExpiresAt': expires_at
        }
    )
    
    return access_token


def handler(event, context):
    """
    This function is triggered by SQS. It processes one order notification at a time.
    """
    print(f"Received event: {json.dumps(event)}")
    
    for record in event['Records']:
        webhook_payload = json.loads(record['body'])
        
        # This is the URL to fetch the full order details
        order_href = webhook_payload.get('resource_href')
        
        if not order_href:
            print("No resource_href found in payload. Skipping.")
            continue
            
        try:
            # Step 1: Get a valid auth token
            auth_token = get_uber_eats_token()
            
            # Step 2: Make the authenticated API call to get order details
            headers = {'Authorization': f'Bearer {auth_token}'}
            order_response = requests.get(order_href, headers=headers)
            order_response.raise_for_status()
            order_details = order_response.json()
            
            print("Successfully fetched order details.")
            # print(json.dumps(order_details, indent=2))
            
            # Step 3: (To be implemented) Enrich the order with data from the Menu table
            # ...
            
            # Step 4: (To be implemented) Save the enriched order to the Orders table
            # ...
            
            # Step 5: (To be implemented) Make a mutation to AppSync to push to frontend
            # ...

        except Exception as e:
            print(f"Failed to process order {order_href}. Error: {e}")
            # Depending on the error, you might want to retry. SQS handles this automatically.
            raise e
            
    return {'status': 'success'}
