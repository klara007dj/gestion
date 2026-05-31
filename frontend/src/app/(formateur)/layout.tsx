'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, BookOpen, ClipboardList, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { href: '/formateur', label: 'Tableau de bord', icon: GraduationCap },
  { href: '/formateur/formations', label: 'Mes formations', icon: BookOpen },
  { href: '/formateur/presences', label: 'Présences', icon: ClipboardList },
  { href: '/formateur/participants', label: 'Participants', icon: Users },
];

export default function FormateurLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'FORMATEUR')) {
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
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Espace Formateur</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href || (href !== '/formateur' && pathname.startsWith(href))
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-gray-600">{user.firstName} {user.lastName}</span>
            <button onClick={logout} className="hidden md:flex text-gray-400 hover:text-red-600">
              <LogOut size={16} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700">
                <Icon size={16} />{label}
              </Link>
            ))}
            <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 text-sm">
              <LogOut size={16} />Déconnexion
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
