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
    <nav className="fixed top-0 w-full bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/[0.04] z-50 transition-all duration-300">
      <div className="page-container h-20 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-1.5 focus:outline-none">
          <span className="text-white text-2xl font-bold tracking-tighter transition-transform group-hover:scale-[1.02]">
            IVY
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
        </Link>
        
        {/* Navigation */}
        <div className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`relative text-sm font-medium transition-all duration-300 py-2 focus:outline-none ${
                  isActive 
                    ? 'text-white' 
                    : 'text-secondary hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(52,211,153,0.4)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-6 items-center">
          {/* Mobile links fallback if you want to keep them visible when compressed */}
          <div className="md:hidden flex gap-4">
            {navLinks.slice(0, 2).map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-secondary hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-5">
              {userEmail && (
                <span className="text-xs font-medium text-secondary/80 hidden lg:inline tracking-wide">{userEmail}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-foreground hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-sm font-semibold px-6 py-2 rounded-lg bg-accent text-[#0F1115] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(52,211,153,0.25)] transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-white"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
