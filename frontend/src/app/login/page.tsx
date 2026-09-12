'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/explore');
    } catch (err: any) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-border rounded-xl bg-white shadow-sm">
      <h1 className="text-2xl font-semibold mb-6">Login to Ivy Homes</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="demo@ivy.homes"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter demo password"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-foreground text-background rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
