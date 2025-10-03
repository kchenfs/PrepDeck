// src/components/auth/PasswordResetConfirm.tsx
import { useState } from 'react';
import { KeyRound, BadgeCheck, Lock, ArrowLeft } from 'lucide-react';
import { confirmResetPassword } from 'aws-amplify/auth';

interface PasswordResetConfirmProps {
  username: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function PasswordResetConfirm({ username, onBack, onSuccess }: PasswordResetConfirmProps) {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword,
      });
      onSuccess();
    } catch (error) {
      console.error("Error confirming new password:", error);
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
                    <KeyRound className="w-6 h-6 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pt-4 pb-6">
              <div className="text-center mb-6">
                <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-white">Enter Verification Code</h1>
                <p className="text-sm text-white/60 mt-1">Check your email for the 6-digit code.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-white/80 mb-2">Verification Code</label>
                  <div className="relative">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="w-full h-11 rounded-md bg-white/5 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-2 focus:ring-zinc-500/40 focus:outline-none px-10 tracking-widest transition"
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BadgeCheck className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-white/80 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      placeholder="Enter a strong password"
                      className="w-full h-11 rounded-md bg-white/5 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-2 focus:ring-zinc-500/40 focus:outline-none px-10 transition"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full h-11 rounded-md bg-blue-600 text-white font-medium tracking-tight ring-1 ring-white/10 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition">
                  Submit New Password
                </button>
                <div className="relative my-3"><div className="h-px bg-white/10"></div></div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={onBack} className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4 flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button type="button" onClick={onSuccess} className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4">
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