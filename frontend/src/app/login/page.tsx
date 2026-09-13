'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { isAuthenticated, login, loading } = useAuth();

  // If already logged in, redirect to explore
  if (isAuthenticated && !loading) {
    router.replace('/explore');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      await login(email, password);
      router.push('/explore');
    } catch (err: any) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-12 relative">
      {/* Subtle emerald glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative w-full max-w-[440px] p-8 md:p-10 border border-white/[0.08] rounded-2xl bg-[#15181E] shadow-2xl shadow-black/50">
        <h1 className="text-3xl font-bold mb-3 text-foreground tracking-tight text-center">Login to Ivy Homes</h1>
        <p className="text-muted text-sm mb-8 text-center leading-relaxed">
          Use a demo account: <br className="hidden sm:block" />demo1@ivy.homes, demo2@ivy.homes, or demo3@ivy.homes
        </p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1115] border border-white/[0.1] text-foreground placeholder-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent hover:border-white/[0.15] transition-all shadow-inner shadow-black/20"
              placeholder="demo1@ivy.homes"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1115] border border-white/[0.1] text-foreground placeholder-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent hover:border-white/[0.15] transition-all shadow-inner shadow-black/20"
              placeholder="Enter demo password"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoggingIn || loading}
            className="w-full py-3.5 bg-accent text-[#0F1115] rounded-xl font-semibold hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)] transition-all duration-300 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
