// src/amplify-config.ts
import type { ResourcesConfig } from '@aws-amplify/core';

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      
      // This is the correct structure for Amplify v6 Hosted UI
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            'http://localhost:5173/',
            'https://prepdeck.momotarosushi.ca/'
          ],
          redirectSignOut: [
            'http://localhost:5173/',
            'https://prepdeck.momotarosushi.ca/'
          ],
          responseType: 'code' as const,
        }
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
      region: import.meta.env.VITE_AWS_REGION,
      defaultAuthMode: 'userPool'
    }
  }
};