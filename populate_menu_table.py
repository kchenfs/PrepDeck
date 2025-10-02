import pandas as pd
import boto3
import numpy as np

# --- CONFIGURATION ---
# The name of your DynamoDB table as defined in your Terraform files.
TABLE_NAME = "Momotaro-Dashboard-Menu"
# The path to your prepared CSV file.
CSV_FILE_PATH = "./menu.csv"  # Assumes the script is in the same directory as the CSV
# --- END CONFIGURATION ---

def populate_menu_table():
    """
    Reads a CSV file with menu data and uploads it to the 'Menu' DynamoDB table.
    """
    try:
        # Initialize the DynamoDB resource.
        # Ensure your AWS credentials are configured (e.g., via AWS CLI 'aws configure').
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(TABLE_NAME)

        print(f"Reading menu data from {CSV_FILE_PATH}...")
        # Load the CSV file into a pandas DataFrame.
        df = pd.read_csv(CSV_FILE_PATH)

        # Replace any potential blank/NaN values with an empty string to prevent errors.
        df = df.replace(np.nan, '', regex=True)

        print(f"Starting upload to '{TABLE_NAME}' DynamoDB table...")
        
        # Use a batch writer for efficient uploading.
        with table.batch_writer() as batch:
            # Iterate over each row in the DataFrame.
            for index, row in df.iterrows():
                item = {
                    'ItemID': str(row['ItemID']),
                    'UberEatsID': str(row['UberEatsID']),
                    'ItemName': str(row['ItemName']),
                    'Location': str(row['Location']),
                    'name_mandarin': str(row['name_mandarin'])
                }
                
                # The batch_writer handles the put_item operation.
                batch.put_item(Item=item)
                print(f"  -> Queued item: {item['ItemName']}")

        print("\n✅ Successfully uploaded all menu items to DynamoDB!")

    except FileNotFoundError:
        print(f"❌ ERROR: The file was not found at '{CSV_FILE_PATH}'.")
        print("Please ensure your 'menu.csv' file is in the same directory as this script.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        print("Please check your AWS credentials and ensure the table name is correct.")

if __name__ == "__main__":
    populate_menu_table()
