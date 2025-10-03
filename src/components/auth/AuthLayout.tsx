// src/components/auth/AuthLayout.tsx
import { useState } from 'react';
import { RestoDashSignIn } from './RestoDashSignIn';
import { PasswordResetRequest } from './PasswordResetRequest';
import { PasswordResetConfirm } from './PasswordResetConfirm';

type AuthView = 'signIn' | 'forgotPassword' | 'confirmReset';

export const AuthLayout = () => {
  const [currentView, setCurrentView] = useState<AuthView>('signIn');
  const [usernameForReset, setUsernameForReset] = useState('');

  console.log('🟢 AuthLayout - Current view:', currentView);

  switch (currentView) {
    case 'signIn':
      return <RestoDashSignIn onForgotPassword={() => setCurrentView('forgotPassword')} />;
    
    case 'forgotPassword':
      return (
        <PasswordResetRequest 
          setUsernameForReset={setUsernameForReset}
          onCodeSent={() => setCurrentView('confirmReset')}
          onBack={() => setCurrentView('signIn')}
        />
      );
    
    case 'confirmReset':
      return (
        <PasswordResetConfirm 
          username={usernameForReset}
          onBack={() => setCurrentView('forgotPassword')}
          onSuccess={() => setCurrentView('signIn')}
        />
      );
    
    default:
      return <RestoDashSignIn onForgotPassword={() => setCurrentView('forgotPassword')} />;
  }
};