"use client";
import Link from 'next/link';
import { Home, UserPlus, Search, Edit, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/register', label: 'Register Agent', icon: UserPlus },
  { href: '/lookup', label: 'Lookup Agent', icon: Search },
  { href: '/manage', label: 'Manage Agents', icon: Edit },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-b border-border shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <ShieldCheck className="h-8 w-8" />
            <span className="text-xl font-bold">AgentVerse Directory</span>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
