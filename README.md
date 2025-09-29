Momotaro Dashboard: Complete Implementation Plan
This document outlines the full "Serverless First" architecture for the Momotaro Dashboard SaaS application. It includes a step-by-step process for provisioning the cloud infrastructure using Terraform and automating deployments with GitHub Actions.

Architectural Overview
The application uses a serverless, event-driven architecture on AWS to ensure scalability, low operational overhead, and cost-effectiveness.

Frontend: A React/TypeScript single-page application (SPA), hosted on S3 and distributed globally via CloudFront.

Backend API: A REST API built with API Gateway and Lambda to ingest orders from delivery partners.

Real-Time Layer: AWS AppSync pushes new orders to the frontend in real-time using WebSockets.

Database: Amazon DynamoDB provides a fast, scalable NoSQL database for menu items and orders.

Security: Amazon Cognito handles user authentication and authorization, ensuring each restaurant's data is isolated.

Infrastructure as Code: Terraform is used to define and provision all AWS resources.

CI/CD: GitHub Actions are used to automate the deployment of both the frontend and backend.

Implementation Plan:

Momotaro Dashboard: Complete Implementation Plan
This document outlines the full "Serverless First" architecture and the step-by-step process to build your application.

Phase 1: Backend Foundation (The Database)
The first step is to get your menu data into a scalable, cloud-native database.

Goal: Create two DynamoDB tables: one for your static menu and one for active orders.

Services Used:

AWS DynamoDB: A fast, flexible, and serverless NoSQL database.

Action Steps:

Prepare Your Menu Data:

Open your results.csv file. Ensure it has clear column headers like ItemName, Category, Location, and Price. Crucially, add a name_mandarin column and fill in the translations.

Save this file as a clean CSV.

Create the Menu Table in DynamoDB:

Navigate to the DynamoDB service in the AWS Console.

Click "Create table".

Table name: Menu

Partition key: ItemID (Type: String) - You will need to add a unique ID for each item in your CSV (e.g., a simple number or a short code).

Leave other settings as default and create the table.

Import Your Menu Data:

Once the Menu table is created, select it and go to the "Actions" menu.

Choose "Import from S3". You will first need to upload your prepared CSV to an S3 bucket and then follow the import wizard. This is the most efficient way to bulk-upload your data.

Create the Orders Table:

Create a second table in DynamoDB.

Table name: Orders

Partition key: OrderID (Type: String)

This table will start empty and will be populated with live orders as they come in.

Phase 2: Core API Logic (Order Ingestion)
This is where you'll build the endpoint that receives order data from Uber Eats, DoorDash, etc.

Goal: Create a secure API endpoint that triggers a function to process incoming orders.

Services Used:

AWS API Gateway: A managed service to create, publish, and secure APIs.

AWS Lambda: A serverless compute service to run your code without managing servers.

Action Steps:

Create a Lambda Function:

Go to the AWS Lambda service.

Click "Create function".

Choose "Author from scratch".

Function name: ProcessOrderWebhook

Runtime: Choose a language you're comfortable with (e.g., Python 3.11 or Node.js 18.x).

In this function's code, you will write the logic to:
a.  Receive the order data (the "event").
b.  Loop through the items in the order.
c.  For each item, query your Menu table in DynamoDB to get its Location and name_mandarin.
d.  Check if at least one item has Location set to back or both.
e.  If so, generate a unique OrderID and save the filtered, translated order data to your Orders table.

Create an API Gateway Endpoint:

Go to the API Gateway service.

Choose to build a REST API.

Create a new resource (e.g., /orders) and a new method under it (POST).

For the integration type, select "Lambda Function" and point it to your ProcessOrderWebhook function.

Deploy the API. This will give you a public URL that you will provide to the delivery services.

Phase 3: Real-Time Layer (Live Dashboard Updates)
This layer is responsible for instantly pushing new orders to the dashboard.

Goal: Create a real-time connection between your backend and your frontend.

Services Used:

AWS AppSync: A managed GraphQL service that simplifies building real-time applications.

Action Steps:

Create an AppSync API:

Go to the AWS AppSync service.

Choose "Build from scratch".

Define a simple GraphQL schema for your orders.

Set the default authorization mode to "Amazon Cognito User Pools" (we'll set this up in Phase 5).

Update Your Lambda Function:

Modify your ProcessOrderWebhook Lambda function.

After successfully saving an order to the Orders table, add code to make a GraphQL mutation call to your new AppSync API.

This mutation will publish the new order data. AppSync will then automatically push this data over WebSockets to any connected dashboard.

Phase 4: Frontend Deployment
Now that the backend is designed, you can deploy your React application.

Goal: Host your React app on a fast, scalable, and low-cost platform.

Services Used:

AWS S3 (Simple Storage Service): To store your static website files.

AWS CloudFront: A global Content Delivery Network (CDN) to make your site fast and secure.

Action Steps:

Build Your React App:

On your local machine, run the command npm run build. This will create a dist folder containing the optimized HTML, CSS, and JavaScript files.

Create and Configure an S3 Bucket:

Go to S3 and create a new bucket.

Enable "Static website hosting" in the bucket's properties.

Upload the entire contents of your dist folder into this bucket.

Create a CloudFront Distribution:

Go to CloudFront and create a new distribution.

For the "Origin domain", select your S3 bucket.

Configure it to redirect HTTP to HTTPS.

Deploy the distribution. This will give you a CloudFront URL (e.g., d1234abcd.cloudfront.net).

Phase 5: Security & Domain
The final step is to secure your application and give it a professional URL.

Goal: Ensure only authenticated users can access the dashboard via a custom domain.

Services Used:

Amazon Cognito: To manage user sign-up, sign-in, and authentication.

Amazon Route 53: A scalable Domain Name System (DNS) web service.

Action Steps:

Set up a Cognito User Pool:

Go to Cognito and create a new User Pool. This will be the user directory for your restaurants.

Configure a sign-in page.

Integrate Cognito with Your React App:

Use the AWS Amplify library in your React code to easily add sign-in, sign-up, and sign-out functionality. Your App.tsx will be updated to show a login page if the user is not authenticated.

Secure Your APIs:

In both API Gateway and AppSync, configure the authorizers to require a valid token from your Cognito User Pool.

Configure a Custom Domain:

Go to Route 53 to manage your domain (e.g., momotarodashboard.com).

Create a DNS record (an A record with an Alias) that points your desired URL (e.g., `)

Looking at UberEats API, we will most likely want to work with the following functions: https://developer.uber.com/docs/eats/references/api/order_suite#tag/WebhookEvents/paths/webhookEvents/post

    1. AcceptOrder
    2. GetOrder

Looking at DoorDash API we w