# generate_signature.py
import hmac
import hashlib
import json

# IMPORTANT: Replace this with your actual Client Secret
CLIENT_SECRET = 'vdlnED_jU0wY-RVbMkQC5xysi-r0Sz1J-pi22rmC'

# The corrected, valid JSON payload
webhook_body = {
  "event_id": "a7a26ff2-e851-45b6-9634-d595f45458b7",
  "event_type": "orders.notification",
  "event_time": 1729651095000,
  "resource_href": "[https://api.uber.com/v1/delivery/order/FAKE-ORDER-ID-12345](https://api.uber.com/v1/delivery/order/FAKE-ORDER-ID-12345)",
  "meta": {
    "user_id": "a169451c-8525-4352-b8ca-070dd449a1a5",
    "resource_id": "FAKE-ORDER-ID-12345",
    "status": "pos"
  },
  "webhook_meta": {
    "client_id": "5b3fa7ba-57d3-4017-a65b-d57dcd2db643",
    "webhook_config_id": "eats-restaurant-order-experience.order-webhooks",
    "webhook_msg_timestamp": 1729651095,
    "webhook_msg_uuid": "b667bd06-2753-44ae-8f60-26df8d351d0f"
  }
}

# Convert the Python dictionary to a compact JSON string
body_as_string = json.dumps(webhook_body, separators=(',', ':'))

# Generate the HMAC-SHA256 signature
digester = hmac.new(
    CLIENT_SECRET.encode('utf-8'),
    body_as_string.encode('utf-8'),
    hashlib.sha256
)

# Print the signature. You will copy this value into Postman.
print(digester.hexdigest())
