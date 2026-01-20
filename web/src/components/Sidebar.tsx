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
    ChevronRight,
    ChevronLeft,
    Menu,
    Instagram,
    X
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/growth', icon: TrendingUp, label: 'Growth' },
    { href: '/engagement', icon: Heart, label: 'Engagement' },
    { href: '/reels', icon: Film, label: 'Reels' },
    { href: '/best-time', icon: Clock, label: 'Best Time' },
    { href: '/hashtags', icon: Hash, label: 'Hashtags' },
    { href: '/export', icon: Download, label: 'Export' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={onToggle}
                className="fixed top-4 left-4 z-[60] p-2.5 rounded-lg bg-white shadow-md border border-gray-200 lg:hidden"
                aria-label="Toggle Menu"
            >
                {isCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen glass flex flex-col z-50 transition-all duration-200 ease-out ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-[72px]' : 'translate-x-0 w-64'
                    }`}
            >
                {/* Logo & Toggle */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600"
                        >
                            <span className="text-base font-bold text-white">∞</span>
                        </div>
                        {!isCollapsed && (
                            <span className="text-lg font-semibold text-white">infini8Graph</span>
                        )}
                    </Link>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={onToggle}
                        className="hidden lg:flex p-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        aria-label="Toggle Sidebar"
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Account Info */}
                {!isCollapsed && (
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                                <Instagram size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    @{user?.username || 'User'}
                                </p>
                                <p className="text-xs text-gray-400">Instagram Business</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {!isCollapsed && (
                        <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Analytics
                        </p>
                    )}
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon size={18} />
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1">{item.label}</span>
                                        {isActive && <ChevronRight size={14} />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={logout}
                        className={`nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${isCollapsed ? 'justify-center px-2' : ''}`}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
