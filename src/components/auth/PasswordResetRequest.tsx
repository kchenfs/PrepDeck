// src/components/auth/PasswordResetRequest.tsx
import { useState } from 'react';
import { Shield, User, ArrowLeft, ChefHat } from 'lucide-react';
import { resetPassword } from 'aws-amplify/auth';

interface PasswordResetRequestProps {
  setUsernameForReset: (username: string) => void;
  onCodeSent: () => void;
  onBack: () => void;
}

export function PasswordResetRequest({ setUsernameForReset, onCodeSent, onBack }: PasswordResetRequestProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      setUsernameForReset(username);
      const output = await resetPassword({ username });
      
      if (output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        console.log('Confirmation code sent');
        onCodeSent();
      }
    } catch (error) {
      console.error("Error sending password reset code:", error);
    }
  };

  return (
    <div className="bg-black text-white antialiased selection:bg-white/10 selection:text-white">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black"></div>
      <div className="fixed inset-0 -z-10 opacity-[0.06]" style={{backgroundImage:"radial-gradient(circle at 20% 0%, #ffffff 0.7px, transparent 0.7px), radial-gradient(circle at 80% 100%, #ffffff 0.7px, transparent 0.7px)", backgroundSize: "36px 36px, 42px 42px"}}></div>
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
              <div className="relative h-32 rounded-lg bg-zinc-900/70 ring-1 ring-white/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white/80" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 h-6 px-2 rounded-md bg-white/5 ring-1 ring-white/10 backdrop-blur flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-[11px] text-white/70">Encrypted</span>
                </div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-6">
              <div className="text-center mb-6">
                <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-white">Reset Password</h1>
                <p className="text-sm text-white/60 mt-1">Enter your username to receive a code.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">Username</label>
                  <div className="relative">
                    <input 
                      id="username" 
                      name="username" 
                      type="text" 
                      required 
                      placeholder="yourusername"
                      className="w-full h-11 rounded-md bg-white/5 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-2 focus:ring-zinc-500/40 focus:outline-none px-10 transition"
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full h-11 rounded-md bg-blue-600 text-white font-medium tracking-tight ring-1 ring-white/10 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition disabled:opacity-60">
                  Send Code
                </button>
                <div className="relative my-3"><div className="h-px bg-white/10"></div></div>
                <div className="flex items-center justify-center">
                  <button type="button" onClick={onBack} className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4 flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
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