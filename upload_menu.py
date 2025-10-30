# upload_menu.py
import boto3
import os
from menu_data import MENU_ITEMS # Import the list from the other file

# --- Configuration ---
# You can set this manually or get it from an environment variable
# MENU_TABLE_NAME = os.environ.get('MENU_TABLE')
MENU_TABLE_NAME = "Momotaro-Dashboard-Menu" # <-- UPDATE THIS with your table name
# ---------------------

def upload_items():
    """
    Uploads all items from menu_data.py to the DynamoDB table
    using a batch writer for efficiency.
    """
    # Note: Make sure your AWS credentials are configured in your environment
    # (e.g., via aws configure)
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(MENU_TABLE_NAME)
    
    print(f"Connecting to table: {MENU_TABLE_NAME}")
    
    total_items = len(MENU_ITEMS)
    print(f"Found {total_items} items to upload...")

    try:
        # Use a batch_writer to efficiently handle the upload
        with table.batch_writer() as batch:
            for i, item in enumerate(MENU_ITEMS):
                # The item dictionary keys MUST match your DynamoDB column names
                print(f"  Uploading item {i+1}/{total_items}: {item['ItemName']} (ID: {item['ItemID']})")
                batch.put_item(Item=item)
        
        print("\nSuccessfully uploaded all menu items to DynamoDB.")
        
    except Exception as e:
        print(f"\n--- ERROR ---")
        print(f"An error occurred during upload: {e}")
        print("Please check your AWS credentials, region, and table name.")

if __name__ == "__main__":
    upload_items()