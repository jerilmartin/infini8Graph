'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    LayoutDashboard,
    TrendingUp,
    Heart,
    Film,
    Clock,
    Hash,
    Download,
    Settings,
    LogOut,
    ChevronRight
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/growth', icon: TrendingUp, label: 'Growth' },
    { href: '/engagement', icon: Heart, label: 'Engagement' },
    { href: '/reels', icon: Film, label: 'Reels' },
    { href: '/best-time', icon: Clock, label: 'Best Time' },
    { href: '/hashtags', icon: Hash, label: 'Hashtags' },
    { href: '/export', icon: Download, label: 'Export' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border)]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-1)' }}>
                        <span className="text-xl font-bold text-white">∞</span>
                    </div>
                    <span className="text-xl font-bold gradient-text">infini8Graph</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ChevronRight size={16} />}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-2)' }}>
                        <span className="text-sm font-bold text-white">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">@{user?.username || 'User'}</p>
                        <p className="text-xs text-[var(--muted)]">Business Account</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
