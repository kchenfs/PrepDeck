import json
import os
import boto3

# Initialize the SQS client
sqs = boto3.client('sqs')
SQS_QUEUE_URL = os.environ.get('SQS_QUEUE_URL')

def handler(event, context):
    """
    This function is triggered by API Gateway. It receives the webhook from Uber Eats,
    validates it (to be implemented), and forwards the payload to an SQS queue.
    """
    print(f"Received event: {json.dumps(event)}")

    # TODO: Implement webhook signature validation for security.

    try:
        # The actual payload from Uber is in the 'body' of the event
        webhook_payload = json.loads(event.get('body', '{}'))
        
        # Send the raw payload to the SQS queue for processing
        sqs.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(webhook_payload)
        )
        
        print("Successfully sent webhook payload to SQS.")

        # Return a 200 OK response immediately to Uber
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success', 'message': 'Webhook received.'})
        }

    except Exception as e:
        print(f"Error processing webhook: {e}")
        # Return an error response if something goes wrong
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': 'Failed to process webhook.'})
        }
