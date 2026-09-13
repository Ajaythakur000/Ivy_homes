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
    <div className="max-w-md mx-auto mt-20 p-8 border border-white/[0.08] rounded-xl bg-surface shadow-sm">
      <h1 className="text-2xl font-semibold mb-2">Login to Ivy Homes</h1>
      <p className="text-secondary text-sm mb-6">Use a demo account: demo1@ivy.homes, demo2@ivy.homes, or demo3@ivy.homes</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="demo1@ivy.homes"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter demo password"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          disabled={isLoggingIn || loading}
          className="w-full py-2 bg-foreground text-background rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
