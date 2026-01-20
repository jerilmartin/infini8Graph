'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function GrowthPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['growth'],
        queryFn: async () => {
            const res = await instagramApi.getGrowth();
            return res.data.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner"></div>
            </div>
        );
    }

    const growth = data || {};
    const growthData = growth.growthData || [];
    const weeklyStats = growth.weeklyStats || {};

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Growth Analytics</h1>
                <p className="text-[var(--muted)]">Track your audience growth and engagement trends</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="metric-card">
                    <div className="flex items-center gap-3 mb-3">
                        <Users size={20} className="text-[var(--primary)]" />
                        <span className="text-[var(--muted)]">Current Followers</span>
                    </div>
                    <div className="metric-value">{(growth.currentFollowers || 0).toLocaleString()}</div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center gap-3 mb-3">
                        <Activity size={20} className="text-[var(--secondary)]" />
                        <span className="text-[var(--muted)]">Posts This Week</span>
                    </div>
                    <div className="metric-value">{weeklyStats.postsThisWeek || 0}</div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center gap-3 mb-3">
                        {weeklyStats.engagementChange >= 0 ? (
                            <TrendingUp size={20} className="text-[var(--success)]" />
                        ) : (
                            <TrendingDown size={20} className="text-[var(--danger)]" />
                        )}
                        <span className="text-[var(--muted)]">Engagement Change</span>
                    </div>
                    <div className={`metric-value ${weeklyStats.engagementChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {weeklyStats.engagementChange >= 0 ? '+' : ''}{weeklyStats.engagementChange || 0}%
                    </div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center gap-3 mb-3">
                        <Activity size={20} className="text-[var(--accent)]" />
                        <span className="text-[var(--muted)]">Avg Engagement/Post</span>
                    </div>
                    <div className="metric-value">{(weeklyStats.avgEngagementPerPost || 0).toLocaleString()}</div>
                </div>
            </div>

            {/* Engagement Over Time Chart */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Engagement Over Time</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={growthData.slice(-30)}>
                        <defs>
                            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={12}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="engagement"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#growthGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Likes vs Comments Trend */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Likes vs Comments Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData.slice(-30)}>
                        <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={12}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }}
                        />
                        <Line type="monotone" dataKey="likes" stroke="#f472b6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="comments" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#f472b6]"></div>
                        <span className="text-sm text-[var(--muted)]">Likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
                        <span className="text-sm text-[var(--muted)]">Comments</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
