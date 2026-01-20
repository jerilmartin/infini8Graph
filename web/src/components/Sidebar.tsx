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
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Megaphone,
    Instagram
} from 'lucide-react';

const navSections = [
    {
        title: 'Analytics',
        items: [
            { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
            { href: '/growth', icon: TrendingUp, label: 'Growth' },
            { href: '/engagement', icon: Heart, label: 'Engagement' },
            { href: '/reels', icon: Film, label: 'Reels' },
            { href: '/best-time', icon: Clock, label: 'Best Time' },
            { href: '/hashtags', icon: Hash, label: 'Hashtags' },
        ]
    },
    {
        title: 'Advertising',
        items: [
            { href: '/ads', icon: Megaphone, label: 'Ads' },
        ]
    },
    {
        title: 'Tools',
        items: [
            { href: '/export', icon: Download, label: 'Export' },
            { href: '/settings', icon: Settings, label: 'Settings' },
        ]
    }
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
                className="mobile-menu-btn"
                aria-label="Toggle Menu"
            >
                {isCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${!isCollapsed ? 'visible' : ''}`}
                onClick={onToggle}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${!isCollapsed ? 'open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 16
                        }}>
                            ∞
                        </div>
                        {!isCollapsed && (
                            <span style={{ fontWeight: 600, fontSize: 16 }}>infini8Graph</span>
                        )}
                    </Link>

                    <button
                        onClick={onToggle}
                        style={{
                            padding: 6,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--sidebar-muted)',
                            cursor: 'pointer',
                            borderRadius: 4,
                            display: isCollapsed ? 'none' : 'flex'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Account Info */}
                {!isCollapsed && (
                    <div style={{ padding: '12px 12px 0' }}>
                        <div className="account-card">
                            <div className="account-avatar">
                                <Instagram size={16} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    @{user?.username || 'User'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--sidebar-muted)' }}>
                                    Instagram Business
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navSections.map((section) => (
                        <div key={section.title} className="sidebar-section">
                            {!isCollapsed && (
                                <div className="sidebar-section-title">{section.title}</div>
                            )}
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <item.icon size={18} />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        onClick={logout}
                        className={`nav-item ${isCollapsed ? 'collapsed' : ''}`}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f87171'
                        }}
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
