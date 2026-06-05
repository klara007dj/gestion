'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, BookOpen, ClipboardList, Award, User, LogOut, Menu, X, Calendar } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { href: '/participant/formations', label: 'Catalogue', icon: BookOpen },
  { href: '/participant/mes-inscriptions', label: 'Mes inscriptions', icon: ClipboardList },
  { href: '/participant/planning', label: 'Planning', icon: Calendar },
  { href: '/participant/attestations', label: 'Attestations', icon: Award },
  { href: '/participant/profil', label: 'Mon profil', icon: User },
];

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'PARTICIPANT')) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">SECEL Formations</span>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
            </div>
            <button onClick={logout} title="Déconnexion"
              className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
              <LogOut size={15} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  pathname.startsWith(href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <button onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 text-sm font-medium">
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
