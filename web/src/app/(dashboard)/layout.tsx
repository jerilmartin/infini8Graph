'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Load sidebar state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) {
            setSidebarCollapsed(JSON.parse(saved));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-[var(--muted)]">Loading your Instagram analytics...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <main
                className={`p-4 md:p-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                    } pt-16 lg:pt-8`}
            >
                {children}
            </main>
        </div>
    );
}
