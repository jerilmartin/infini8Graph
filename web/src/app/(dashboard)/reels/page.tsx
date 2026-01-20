'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Film, Heart, MessageCircle, Eye, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReelsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['reels'],
        queryFn: async () => {
            const res = await instagramApi.getReels();
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

    const reels = data?.reels || [];
    const summary = data?.summary || {};
    const comparison = data?.comparison || {};

    const chartData = reels.slice(0, 10).map((reel: any, i: number) => ({
        name: `Reel ${i + 1}`,
        engagement: reel.engagement,
        likes: reel.likes,
        comments: reel.comments
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Reels Analytics</h1>
                <p className="text-[var(--muted)]">Performance metrics for your video content</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="metric-card">
                    <Film className="mb-3 text-[var(--primary)]" size={24} />
                    <div className="metric-value">{summary.totalReels || 0}</div>
                    <div className="metric-label">Total Reels</div>
                </div>
                <div className="metric-card">
                    <Heart className="mb-3 text-[var(--danger)]" size={24} />
                    <div className="metric-value">{summary.avgLikes?.toLocaleString() || 0}</div>
                    <div className="metric-label">Avg Likes</div>
                </div>
                <div className="metric-card">
                    <MessageCircle className="mb-3 text-[var(--secondary)]" size={24} />
                    <div className="metric-value">{summary.avgComments?.toLocaleString() || 0}</div>
                    <div className="metric-label">Avg Comments</div>
                </div>
                <div className="metric-card">
                    <Eye className="mb-3 text-[var(--accent)]" size={24} />
                    <div className="metric-value">{summary.totalReach?.toLocaleString() || 0}</div>
                    <div className="metric-label">Total Reach</div>
                </div>
                <div className="metric-card">
                    <TrendingUp className="mb-3 text-[var(--success)]" size={24} />
                    <div className="metric-value">{comparison.reelMultiplier || 0}x</div>
                    <div className="metric-label">vs Posts</div>
                </div>
            </div>

            {/* Comparison Banner */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Reels vs Posts Performance</h3>
                        <p className="text-[var(--muted)]">
                            Your reels get <span className="text-[var(--success)] font-bold">{comparison.reelMultiplier || 0}x</span> more engagement than regular posts
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-[var(--muted)]">Reel Avg: {comparison.reelAvgEngagement?.toLocaleString() || 0}</div>
                        <div className="text-sm text-[var(--muted)]">Post Avg: {comparison.postAvgEngagement?.toLocaleString() || 0}</div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Top Reels Engagement</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }} />
                        <Bar dataKey="engagement" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Reels Grid */}
            <div>
                <h3 className="text-lg font-semibold mb-6">Your Reels</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {reels.map((reel: any) => (
                        <div key={reel.id} className="card p-0 overflow-hidden group">
                            <div className="aspect-[9/16] bg-[var(--border)] relative">
                                {reel.thumbnail && (
                                    <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-4 text-white">
                                            <span className="flex items-center gap-1"><Heart size={16} /> {reel.likes}</span>
                                            <span className="flex items-center gap-1"><MessageCircle size={16} /> {reel.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
