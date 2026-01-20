'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Users, Heart, Eye, Bookmark, TrendingUp, TrendingDown, Image } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function MetricCard({ label, value, icon: Icon, trend, color }: {
    label: string;
    value: string | number;
    icon: any;
    trend?: number;
    color: string;
}) {
    return (
        <div className="metric-card">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={24} style={{ color }} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="metric-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="metric-label">{label}</div>
        </div>
    );
}

function RecentPostCard({ post }: { post: any }) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--card-hover)] transition-colors">
            <div className="w-16 h-16 rounded-lg bg-[var(--border)] overflow-hidden flex-shrink-0">
                {post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Image size={24} className="text-[var(--muted)]" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-success">{post.type}</span>
                    <span className="text-xs text-[var(--muted)]">
                        {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                        <Heart size={14} className="text-[var(--danger)]" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                        💬 {post.comments}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['overview'],
        queryFn: async () => {
            const res = await instagramApi.getOverview();
            return res.data.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-[var(--muted)]">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-[var(--danger)] mb-2">Failed to load analytics</p>
                    <p className="text-[var(--muted)] text-sm">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    const metrics = data?.metrics || {};
    const profile = data?.profile || {};
    const recentPosts = data?.recentPosts || [];

    // Generate chart data from recent posts
    const chartData = recentPosts.slice(0, 7).reverse().map((post: any, i: number) => ({
        name: `Post ${i + 1}`,
        engagement: post.engagement,
        likes: post.likes,
        comments: post.comments
    }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, @{profile.username}</h1>
                    <p className="text-[var(--muted)]">Here's your Instagram performance overview</p>
                </div>
                <div className="text-right text-sm text-[var(--muted)]">
                    Last updated: {new Date(data?.lastUpdated || Date.now()).toLocaleString()}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid-metrics">
                <MetricCard label="Followers" value={metrics.followers || 0} icon={Users} color="#8b5cf6" />
                <MetricCard label="Engagement Rate" value={`${metrics.engagementRate || 0}%`} icon={Heart} color="#f472b6" />
                <MetricCard label="Avg. Likes" value={metrics.avgLikes || 0} icon={Heart} color="#ef4444" />
                <MetricCard label="Total Reach" value={metrics.totalReach || 0} icon={Eye} color="#06b6d4" />
                <MetricCard label="Total Saved" value={metrics.totalSaved || 0} icon={Bookmark} color="#22c55e" />
                <MetricCard label="Total Posts" value={metrics.posts || 0} icon={Image} color="#f59e0b" />
            </div>

            {/* Charts Row */}
            <div className="grid-charts">
                <div className="chart-container">
                    <h3 className="text-lg font-semibold mb-6">Engagement Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                            <YAxis stroke="#71717a" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#12121a',
                                    border: '1px solid #2a2a3a',
                                    borderRadius: 8
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="engagement"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#engagementGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h3 className="text-lg font-semibold mb-6">Likes vs Comments</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                            <YAxis stroke="#71717a" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#12121a',
                                    border: '1px solid #2a2a3a',
                                    borderRadius: 8
                                }}
                            />
                            <Bar dataKey="likes" fill="#f472b6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="comments" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Posts */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-6">Recent Posts Performance</h3>
                <div className="space-y-2">
                    {recentPosts.slice(0, 5).map((post: any, i: number) => (
                        <RecentPostCard key={post.id || i} post={post} />
                    ))}
                </div>
            </div>
        </div>
    );
}
