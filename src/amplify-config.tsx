// src/amplify-config.ts

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      
      // THIS IS THE FIX: The 'oauth' configuration is now a top-level property
      // within the Cognito object, and 'domain' is renamed to 'userPoolWebDomain'.
      // The 'loginWith' wrapper has been removed.
      userPoolWebDomain: import.meta.env.VITE_COGNITO_DOMAIN,
      oauth: {
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
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_API_URL,
      region: import.meta.env.VITE_AWS_REGION,
      defaultAuthMode: 'userPool' as const
    }
  }
};