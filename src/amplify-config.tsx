// src/amplify-config.ts

export const amplifyConfig = {
  Auth: {
    Cognito: {
      // Read values from environment variables
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
          // 👇 CHANGE IS HERE 👇
          redirectSignOut: [
            'http://localhost:5173/',
            'https://prepdeck.momotarosushi.ca/'
          ],
          responseType: 'code',
        }
      }
    }
  }
};