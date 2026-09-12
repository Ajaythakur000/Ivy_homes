'use client'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, userEmail, logout } = useAuth();

  const navLinks = [
    { href: '/explore', label: 'Explore' },
    { href: '/rent', label: 'Rent' },
    { href: '/projects', label: 'Projects' },
    { href: '/insights', label: 'Insights' },
    { href: '/favourites', label: 'Saved' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Ivy.
        </Link>
        <div className="flex gap-6 items-center">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(link.href) 
                  ? 'text-foreground' 
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {userEmail && (
                <span className="text-xs text-secondary hidden md:inline">{userEmail}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 border border-border text-foreground rounded-md hover:bg-white transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-foreground text-background rounded-md"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
