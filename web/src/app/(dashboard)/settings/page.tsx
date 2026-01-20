'use client';

import { useAuth } from '@/lib/auth';
import { User, Shield, Bell, Palette, LogOut } from 'lucide-react';

export default function SettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-[var(--muted)]">Manage your account and preferences</p>
            </div>

            {/* Account Section */}
            <div className="card">
                <div className="flex items-center gap-4 mb-6">
                    <User size={24} className="text-[var(--primary)]" />
                    <h3 className="text-lg font-semibold">Account</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--card-hover)]">
                        <div>
                            <div className="font-medium">Instagram Account</div>
                            <div className="text-sm text-[var(--muted)]">@{user?.username}</div>
                        </div>
                        <span className="badge badge-success">Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--card-hover)]">
                        <div>
                            <div className="font-medium">Account Type</div>
                            <div className="text-sm text-[var(--muted)]">Business / Creator</div>
                        </div>
                        <span className="badge badge-success">Active</span>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="card">
                <div className="flex items-center gap-4 mb-6">
                    <Shield size={24} className="text-[var(--secondary)]" />
                    <h3 className="text-lg font-semibold">Security</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--card-hover)]">
                        <div>
                            <div className="font-medium">Token Encryption</div>
                            <div className="text-sm text-[var(--muted)]">Your Instagram tokens are AES encrypted</div>
                        </div>
                        <span className="badge badge-success">Enabled</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--card-hover)]">
                        <div>
                            <div className="font-medium">Secure Cookies</div>
                            <div className="text-sm text-[var(--muted)]">HttpOnly cookies prevent XSS attacks</div>
                        </div>
                        <span className="badge badge-success">Enabled</span>
                    </div>
                </div>
            </div>

            {/* Data Section */}
            <div className="card">
                <div className="flex items-center gap-4 mb-6">
                    <Palette size={24} className="text-[var(--accent)]" />
                    <h3 className="text-lg font-semibold">Data & Privacy</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--card-hover)]">
                        <div>
                            <div className="font-medium">Analytics Caching</div>
                            <div className="text-sm text-[var(--muted)]">Data refreshes automatically every 5 minutes</div>
                        </div>
                        <span className="badge badge-success">Active</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--card-hover)]">
                        <div className="font-medium mb-2">Data We Access</div>
                        <div className="text-sm text-[var(--muted)] space-y-1">
                            <p>• Basic profile information</p>
                            <p>• Post and reel insights</p>
                            <p>• Engagement metrics</p>
                            <p>• Follower demographics (if available)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-[var(--danger)]" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="flex items-center gap-4 mb-6">
                    <LogOut size={24} className="text-[var(--danger)]" />
                    <h3 className="text-lg font-semibold text-[var(--danger)]">Danger Zone</h3>
                </div>

                <p className="text-sm text-[var(--muted)] mb-4">
                    Logging out will disconnect your Instagram account. You can reconnect anytime.
                </p>

                <button
                    onClick={logout}
                    className="btn px-6 py-3 bg-[var(--danger)] text-white hover:opacity-90"
                >
                    <LogOut size={18} />
                    Disconnect & Logout
                </button>
            </div>
        </div>
    );
}
