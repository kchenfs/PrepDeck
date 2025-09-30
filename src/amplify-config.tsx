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
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
      region: import.meta.env.VITE_AWS_REGION, // e.g., 'ca-central-1'
      // THIS IS THE FIX: 'authorizationType' is now 'defaultAuthMode'
      // and the value is 'amazon_cognito_user_pools'
      defaultAuthMode: 'AMAZON_COGNITO_USER_POOLS'
    }
  }
};
