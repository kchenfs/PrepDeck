Momotaro Dashboard – Uber Eats Integration (Summary)
Architecture Overview

Frontend: React/TypeScript SPA, hosted on S3 + CloudFront.

Backend: API Gateway + Lambda for order ingestion.

Database: DynamoDB (Menu + Orders tables).

Real-Time Updates: AppSync pushes orders to frontend.

Auth: Cognito for user authentication.

Infra as Code: Terraform.

CI/CD: GitHub Actions.

Uber Eats Integration

The backend receives orders via Uber Eats webhooks and processes them through Lambda → DynamoDB.

Relevant Uber Eats API Functions

AcceptOrder – confirm receipt of an order.

GetOrder – retrieve full order details.

WebhookEvents (POST) – Uber pushes new order events to the app.

Implementation Steps

Orders Table

DynamoDB Orders table with OrderID as primary key.

Populated by incoming Uber Eats webhook events.

Webhook Setup

API Gateway exposes /orders endpoint.

Endpoint integrates with ProcessOrderWebhook Lambda.

Lambda parses Uber order payload, maps items against Menu table, translates names, and writes to Orders table.

Authentication

Supports OAuth and Basic Auth depending on Uber Eats webhook configuration.

Tokens verified in API Gateway + Lambda before processing requests.

Testing

Configure a test event from the Uber Developer Dashboard to trigger the webhook.

Validate database entries in Orders after test webhook delivery.
