// src/amplify-config.ts

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
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
          responseType: 'code',
        }
      }
    }
  },
  // THIS IS THE NEW SECTION
  API: {
    GraphQL: {
      // Get these values from your `terraform output` command
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
      region: import.meta.env.VITE_AWS_REGION, // e.g., 'ca-central-1'
      authorizationType: 'AMAZON_COGNITO_USER_POOLS'
    }
  }
};
