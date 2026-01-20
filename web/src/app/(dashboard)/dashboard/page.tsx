'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Users, Heart, Eye, Bookmark, TrendingUp, TrendingDown, Image, RefreshCw, Instagram } from 'lucide-react';
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
            <div className="metric-icon" style={{ background: `${color}15`, color }}>
                <Icon size={20} />
            </div>
            <div className="metric-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="metric-label">{label}</div>
            {trend !== undefined && (
                <div className="stat-row" style={{ marginTop: 8 }}>
                    {trend >= 0 ? (
                        <TrendingUp size={14} className="stat-up" />
                    ) : (
                        <TrendingDown size={14} className="stat-down" />
                    )}
                    <span className={trend >= 0 ? 'stat-up' : 'stat-down'} style={{ fontSize: 12, fontWeight: 500 }}>
                        {Math.abs(trend)}%
                    </span>
                </div>
            )}
        </div>
    );
}

function PostRow({ post }: { post: any }) {
    return (
        <tr>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        background: '#f3f4f6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Image size={16} style={{ color: '#9ca3af' }} />
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{post.type}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {new Date(post.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </td>
            <td style={{ fontWeight: 500 }}>{post.likes?.toLocaleString() || 0}</td>
            <td style={{ fontWeight: 500 }}>{post.comments?.toLocaleString() || 0}</td>
            <td style={{ fontWeight: 500 }}>{post.engagement?.toLocaleString() || 0}</td>
        </tr>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p className="text-muted">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: 500, marginBottom: 8 }}>Failed to load analytics</p>
                    <p className="text-muted" style={{ marginBottom: 16 }}>Check your connection and try again</p>
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

    const chartData = recentPosts.slice(0, 10).reverse().map((post: any, i: number) => ({
        name: new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        engagement: post.engagement,
        likes: post.likes,
        comments: post.comments
    }));

    return (
        <div>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <h1 className="page-title">@{profile.username}</h1>
                        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Instagram size={12} />
                            Instagram
                        </span>
                    </div>
                    <p className="page-subtitle">Account performance overview</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="btn btn-secondary btn-sm"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid-metrics" style={{ marginBottom: 24 }}>
                <MetricCard label="Followers" value={metrics.followers || 0} icon={Users} color="#6366f1" />
                <MetricCard label="Engagement" value={`${metrics.engagementRate || 0}%`} icon={Heart} color="#ec4899" />
                <MetricCard label="Avg Likes" value={metrics.avgLikes || 0} icon={Heart} color="#ef4444" />
                <MetricCard label="Total Reach" value={metrics.totalReach || 0} icon={Eye} color="#0ea5e9" />
                <MetricCard label="Total Saved" value={metrics.totalSaved || 0} icon={Bookmark} color="#10b981" />
                <MetricCard label="Posts" value={metrics.posts || 0} icon={Image} color="#f59e0b" />
            </div>

            {/* Charts */}
            <div className="grid-charts" style={{ marginBottom: 24 }}>
                <div className="chart-container">
                    <div className="card-header">
                        <h3 className="card-title">Engagement Trend</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    fontSize: 13
                                }}
                            />
                            <Area type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} fill="url(#engGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="card-header">
                        <h3 className="card-title">Likes vs Comments</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    fontSize: 13
                                }}
                            />
                            <Bar dataKey="likes" fill="#ec4899" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="comments" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Posts Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Posts</h3>
                    <span className="badge badge-info">{recentPosts.length} posts</span>
                </div>
                {recentPosts.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Post</th>
                                <th>Likes</th>
                                <th>Comments</th>
                                <th>Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPosts.slice(0, 5).map((post: any, i: number) => (
                                <PostRow key={post.id || i} post={post} />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <p>No posts found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
