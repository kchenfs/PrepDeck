import json
import os
import boto3
import requests
import time
from urllib.parse import urlencode

# Initialize AWS clients
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
INTEGRATION_TABLE_NAME = os.environ.get('INTEGRATION_TABLE_NAME')
UBER_CLIENT_ID_PARAM = os.environ.get('UBER_CLIENT_ID_PARAM')
UBER_CLIENT_SECRET_PARAM = os.environ.get('UBER_CLIENT_SECRET_PARAM')
FRONTEND_REDIRECT_SUCCESS = os.environ.get('FRONTEND_REDIRECT_SUCCESS')
FRONTEND_REDIRECT_ERROR = os.environ.get('FRONTEND_REDIRECT_ERROR')

# Initialize DynamoDB Table resource
integration_table = dynamodb.Table(INTEGRATION_TABLE_NAME)

# Uber API endpoints
UBER_TOKEN_URL = "https://auth.uber.com/oauth/v2/token"
UBER_STORES_URL = "https://api.uber.com/v1/eats/stores"
UBER_ACTIVATE_URL_TEMPLATE = "https://api.uber.com/v1/eats/stores/{store_id}/pos_data"

# --- Helper Functions ---

def get_ssm_parameter(name, with_decryption=True):
    """Fetches a parameter from SSM Parameter Store."""
    try:
        response = ssm.get_parameter(Name=name, WithDecryption=with_decryption)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Error getting SSM parameter '{name}': {e}")
        raise

def exchange_code_for_token(auth_code, client_id, client_secret, redirect_uri):
    """Exchanges the authorization code for an access token."""
    payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'authorization_code',
        'code': auth_code,
        'redirect_uri': redirect_uri # Must match the URI used in the initial request
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    try:
        response = requests.post(UBER_TOKEN_URL, data=payload, headers=headers)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error exchanging code for token: {e}")
        if e.response is not None:
            print(f"Response body: {e.response.text}")
        raise

def get_uber_stores(access_token):
    """Fetches store details using the access token."""
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    try:
        response = requests.get(UBER_STORES_URL, headers=headers)
        response.raise_for_status()
        return response.json().get('stores', [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Uber stores: {e}")
        if e.response is not None:
            print(f"Response body: {e.response.text}")
        raise

def activate_uber_integration(access_token, store_id):
    """Activates the POS integration for a given store ID."""
    url = UBER_ACTIVATE_URL_TEMPLATE.format(store_id=store_id)
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json' # Assuming POST requires JSON, check Uber docs
    }
    # Payload might be needed depending on Uber's requirements, e.g., nominating as order manager
    payload = {
         "is_order_manager": True # Example: Nominate this app to manage orders
         # Add other required fields based on Uber documentation
    }
    try:
        # Check Uber API docs - sometimes activation is POST, sometimes PATCH
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"Successfully activated integration for store {store_id}.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error activating Uber integration for store {store_id}: {e}")
        if e.response is not None:
            print(f"Response body: {e.response.text}")
        raise

def store_integration_mapping(user_id, service, store_id):
    """Stores the mapping in DynamoDB."""
    try:
        timestamp = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        integration_id = f"{service}-{store_id}" # e.g., "uber-1234abcd"
        integration_table.put_item(
            Item={
                'userId': user_id,
                'integrationId': integration_id,
                'serviceName': service,
                'storeId': store_id, # Store raw store ID separately if needed
                'connectedAt': timestamp
                # Add any other relevant details
            }
        )
        print(f"Stored mapping for user {user_id}, service {service}, store {store_id}")
    except Exception as e:
        print(f"Error storing integration mapping in DynamoDB: {e}")
        # Decide if this should be a fatal error or just logged

# --- Main Handler ---

def handler(event, context):
    """
    Handles the GET request from Uber after user authorization.
    Exchanges the code, gets store IDs, activates integration, stores mapping, and redirects.
    """
    print(f"Received callback event: {json.dumps(event)}")

    # This change ensures query_params is ALWAYS a dictionary, even if event.get() returns None
    query_params = event.get('queryStringParameters') or {} 

    auth_code = query_params.get('code')
    # Read the state parameter which contains the user ID
    user_id = query_params.get('state')

    # Validate that we have a user ID
    if not user_id:
        print("Error: User ID not found in state parameter.")
        return redirect_to_frontend(FRONTEND_REDIRECT_ERROR)

    print(f"Processing OAuth callback for user: {user_id}")

    if not auth_code:
        print("Error: Authorization code not found in callback.")
        return redirect_to_frontend(FRONTEND_REDIRECT_ERROR)

    try:
        # Retrieve secrets
        client_id = get_ssm_parameter(UBER_CLIENT_ID_PARAM)
        client_secret = get_ssm_parameter(UBER_CLIENT_SECRET_PARAM)

        # --- Construct the exact redirect_uri used in the initial request ---
        # This needs to match what you told Uber in Step 1 (the URL of this endpoint)
        # API Gateway v2.0 payload includes domainName and path under requestContext.http
        domain_name = event.get('requestContext', {}).get('domainName', '')
        # path = event.get('requestContext', {}).get('http', {}).get('path', '') # This would be /auth/uber/callback
        # For simplicity, hardcode the path part if it's fixed
        callback_path = "/auth/uber/callback" # Make sure this matches your API Gateway route key
        if not domain_name:
             raise ValueError("Could not determine API domain name from event context.")
        # Construct the full redirect URI
        backend_redirect_uri = f"https://{domain_name}{callback_path}"
        print(f"Using redirect_uri for token exchange: {backend_redirect_uri}")
        # --- End Construct redirect_uri ---


        # Exchange code for token
        token_data = exchange_code_for_token(auth_code, client_id, client_secret, backend_redirect_uri)
        access_token = token_data.get('access_token')
        if not access_token:
            raise ValueError("Access token not found in Uber response.")

        print("Successfully obtained access token.")

        # Get store IDs associated with the merchant
        stores = get_uber_stores(access_token)
        if not stores:
            print("No stores found for this merchant.")
            # Decide how to handle this - maybe redirect with info?
            return redirect_to_frontend(FRONTEND_REDIRECT_SUCCESS) # Or a specific 'no stores' status?

        print(f"Found stores: {[s.get('store_id') for s in stores]}")

        # Activate integration for each store and store mapping
        activation_successful = False
        for store in stores:
            store_id = store.get('store_id')
            if store_id:
                try:
                    activate_uber_integration(access_token, store_id)
                    store_integration_mapping(user_id, 'uber', store_id)
                    activation_successful = True # Mark success if at least one store activates
                except Exception as activation_error:
                    # Log the error but continue trying other stores if any
                    print(f"Failed to activate or store mapping for store {store_id}: {activation_error}")

        # Redirect based on overall success
        if activation_successful:
            print("Redirecting to frontend success URL.")
            return redirect_to_frontend(FRONTEND_REDIRECT_SUCCESS)
        else:
            # If all activations failed (or no stores had IDs)
            print("No stores were successfully activated. Redirecting to frontend error URL.")
            return redirect_to_frontend(FRONTEND_REDIRECT_ERROR)

    except Exception as e:
        print(f"An error occurred during the OAuth callback process: {e}")
        return redirect_to_frontend(FRONTEND_REDIRECT_ERROR)

def redirect_to_frontend(url):
    """Returns the API Gateway response format for a 302 Redirect."""
    return {
        'statusCode': 302,
        'headers': {
            'Location': url
        },
        'body': '' # Body is ignored for 302
    }