// src/components/auth/RestoDashSignIn.tsx

import { useState } from 'react';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import {
  ChefHat, Lock, User, Check,
} from 'lucide-react';

interface RestoDashSignInProps {
  onForgotPassword: () => void;
}

export function RestoDashSignIn({ onForgotPassword }: RestoDashSignInProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    try {
      await signIn({ username, password });
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      console.error('Error with Google sign-in:', error);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-[Geist,sans-serif] antialiased selection:bg-white/10 selection:text-white">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgb(39 39 42 / 0.5) inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
        }
      `}</style>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black"></div>
      <div className="fixed inset-0 -z-10 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 0%, #ffffff 0.7px, transparent 0.7px), radial-gradient(circle at 80% 100%, #ffffff 0.7px, transparent 0.7px)", backgroundSize: "36px 36px, 42px 42px" }}></div>
      <header className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <span className="text-sm font-semibold tracking-tight text-white/80">PD</span>
          </div>
          <span className="text-sm md:text-base font-medium tracking-tight text-white/80">PrepDeck</span>
        </div>
      </header>
      <main className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-lg shadow-black/20">
            <div className="p-6 pb-3">
              <div className="rounded-lg">
                <div className="relative h-36 rounded-lg bg-zinc-900/70 ring-1 ring-white/10 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur flex items-center justify-center">
                        <ChefHat className="w-7 h-7 text-white/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pt-4 pb-6">
              <div className="text-center mb-6">
                <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-white">Sign in to your restaurant dashboard</h1>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">Username</label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="yourusername"
                      autoComplete="username"
                      className="w-full h-11 rounded-md bg-white/5 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-2 focus:ring-zinc-500/40 focus:outline-none px-10 transition"
                      onChange={(e) => setUsername(e.target.value)}
                      value={username}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="password"  className="block text-sm font-medium text-white/80 mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                      className="w-full h-11 rounded-md bg-white/5 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-2 focus:ring-zinc-500/40 focus:outline-none px-10 transition"
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="h-4 w-4 rounded-[6px] bg-white/5 ring-1 ring-white/15 flex items-center justify-center transition peer-focus:ring-2 peer-focus:ring-zinc-500/40">
                      <Check className={`w-3 h-3 text-white transition ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                    </span>
                    <span className="ml-2 text-sm text-white/60">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-md bg-blue-600 text-white font-medium tracking-tight ring-1 ring-white/10 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                 <div className="relative my-4">
                  <div className="h-px bg-white/10"></div>
                  <span className="absolute inset-x-0 -top-2 mx-auto px-2 bg-transparent text-xs text-white/50 w-max">or continue with</span>
                </div>
                <div className="grid grid-cols-1">
                  <button
                    type="button"
                    className="h-10 rounded-md bg-white text-zinc-900 ring-1 ring-black/5 hover:bg-zinc-50 transition flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    onClick={handleGoogleSignIn}
                  >
                    <span className="h-5 w-5">
                      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.9-6.9C35.9 1.74 30.47 0 24 0 14.62 0 6.36 5.43 2.52 13.33l8.42 6.52C12.89 13.19 17.92 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.44-4.66H24v9.13h12.65c-.55 2.99-2.18 5.52-4.65 7.22l7.32 5.68C43.57 37.22 46.5 31.15 46.5 24z"></path><path fill="#FBBC05" d="M10.94 27.98a14.49 14.49 0 0 1 0-7.96l-8.42-6.52a24 24 0 0 0 0 20.99l8.42-6.51z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.32-5.68c-2.02 1.36-4.61 2.17-8.58 2.17-6.08 0-11.11-3.7-13.06-8.89l-8.42 6.51C6.36 42.57 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    </span>
                    <span className="text-sm font-medium">Google</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}