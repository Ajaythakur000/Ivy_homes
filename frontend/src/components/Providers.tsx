'use client'
import { AuthProvider } from '@/lib/AuthContext';
import { FavouritesProvider } from '@/lib/FavouritesContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FavouritesProvider>
        {children}
      </FavouritesProvider>
    </AuthProvider>
  );
}
