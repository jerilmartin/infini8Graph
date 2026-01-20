'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Users, Heart, Eye, Bookmark, TrendingUp, TrendingDown, Image, Instagram, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function MetricCard({ label, value, icon: Icon, trend, color }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    color: string;
}) {
    return (
        <div className="metric-card">
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={20} style={{ color }} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
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
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Image size={20} className="text-gray-400" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-success">{post.type}</span>
                    <span className="text-xs text-gray-500">
                        {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <Heart size={14} className="text-red-500" /> {post.likes}
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
    const { data, isLoading, error, refetch, isFetching } = useQuery({
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
                    <p className="text-gray-500">Loading your analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-500 mb-2 font-medium">Failed to load analytics</p>
                    <p className="text-gray-500 text-sm mb-4">Please check your connection and try again</p>
                    <button onClick={() => refetch()} className="btn btn-primary">
                        Try Again
                    </button>
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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="page-header">
                    <div className="flex items-center gap-3">
                        <h1>@{profile.username}</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500 to-orange-400 text-white">
                            <Instagram size={12} />
                            Instagram
                        </span>
                    </div>
                    <p>Your account performance overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="btn btn-secondary text-sm"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <span className="text-xs text-gray-500">
                        Updated: {new Date(data?.lastUpdated || Date.now()).toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid-metrics">
                <MetricCard label="Followers" value={metrics.followers || 0} icon={Users} color="#6366f1" />
                <MetricCard label="Engagement Rate" value={`${metrics.engagementRate || 0}%`} icon={Heart} color="#ec4899" />
                <MetricCard label="Avg. Likes" value={metrics.avgLikes || 0} icon={Heart} color="#ef4444" />
                <MetricCard label="Total Reach" value={metrics.totalReach || 0} icon={Eye} color="#0ea5e9" />
                <MetricCard label="Total Saved" value={metrics.totalSaved || 0} icon={Bookmark} color="#10b981" />
                <MetricCard label="Total Posts" value={metrics.posts || 0} icon={Image} color="#f59e0b" />
            </div>

            {/* Charts Row */}
            <div className="grid-charts">
                <div className="chart-container">
                    <h3 className="text-base font-semibold mb-4 text-gray-900">Engagement Trend</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="engagement"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#engagementGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h3 className="text-base font-semibold mb-4 text-gray-900">Likes vs Comments</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar dataKey="likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="comments" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Posts */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Recent Posts</h3>
                    <span className="text-xs text-gray-500">{recentPosts.length} posts analyzed</span>
                </div>
                <div className="space-y-1">
                    {recentPosts.slice(0, 5).map((post: any, i: number) => (
                        <RecentPostCard key={post.id || i} post={post} />
                    ))}
                    {recentPosts.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No posts found</p>
                    )}
                </div>
            </div>
        </div>
    );
}
