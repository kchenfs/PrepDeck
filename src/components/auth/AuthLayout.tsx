// src/components/auth/AuthLayout.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { RestoDashSignIn } from './RestoDashSignIn';
import { PasswordResetRequest } from './PasswordResetRequest';
import { PasswordResetConfirm } from './PasswordResetConfirm';

export const AuthLayout = () => {
  // Get the 'route' from the authenticator's state
  const { route } = useAuthenticator((context) => [context.route]);
  
  // Add state to hold the username during the password reset flow
  const [usernameForReset, setUsernameForReset] = useState('');

  // Debug: Log route changes
  useEffect(() => {
    console.log('Current auth route:', route);
  }, [route]);

  switch (route) {
    case 'idle':
    case 'signIn':
    case 'setup':
      return <RestoDashSignIn />;
    
    case 'forgotPassword':
      return <PasswordResetRequest setUsernameForReset={setUsernameForReset} />;
    
    case 'confirmResetPassword':
      return <PasswordResetConfirm username={usernameForReset} />;
      
    default:
      console.log('Unhandled route, defaulting to sign in:', route);
      return <RestoDashSignIn />;
  }
};