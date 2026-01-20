'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Hash, TrendingUp, Heart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HashtagsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['hashtags'],
        queryFn: async () => {
            const res = await instagramApi.getHashtags();
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

    const topPerforming = data?.topPerforming || [];
    const mostUsed = data?.mostUsed || [];

    const chartData = topPerforming.slice(0, 10).map((h: any) => ({
        name: h.tag.replace('#', ''),
        engagement: h.avgEngagement
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Hashtag Analytics</h1>
                <p className="text-[var(--muted)]">Discover which hashtags drive the most engagement</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="metric-card">
                    <Hash className="mb-3 text-[var(--primary)]" size={24} />
                    <div className="metric-value">{data?.totalHashtagsUsed || 0}</div>
                    <div className="metric-label">Unique Hashtags</div>
                </div>
                <div className="metric-card">
                    <BarChart3 className="mb-3 text-[var(--secondary)]" size={24} />
                    <div className="metric-value">{data?.avgHashtagsPerPost || 0}</div>
                    <div className="metric-label">Avg per Post</div>
                </div>
                <div className="metric-card">
                    <TrendingUp className="mb-3 text-[var(--success)]" size={24} />
                    <div className="metric-value">{topPerforming[0]?.avgEngagement?.toLocaleString() || 0}</div>
                    <div className="metric-label">Best Performing</div>
                </div>
                <div className="metric-card">
                    <Heart className="mb-3 text-[var(--accent)]" size={24} />
                    <div className="metric-value">{data?.postsAnalyzed || 0}</div>
                    <div className="metric-label">Posts Analyzed</div>
                </div>
            </div>

            {/* Chart */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Top 10 Hashtags by Engagement</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" stroke="#71717a" fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={12} width={100} />
                        <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }} />
                        <Bar dataKey="engagement" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card overflow-hidden p-0">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp size={18} className="text-[var(--success)]" />
                            Top Performing
                        </h3>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Hashtag</th>
                                <th>Uses</th>
                                <th>Avg Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topPerforming.slice(0, 10).map((h: any) => (
                                <tr key={h.tag}>
                                    <td className="font-medium text-[var(--primary)]">{h.tag}</td>
                                    <td>{h.usageCount}</td>
                                    <td>{h.avgEngagement.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card overflow-hidden p-0">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Hash size={18} className="text-[var(--secondary)]" />
                            Most Used
                        </h3>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Hashtag</th>
                                <th>Uses</th>
                                <th>Avg Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mostUsed.slice(0, 10).map((h: any) => (
                                <tr key={h.tag}>
                                    <td className="font-medium text-[var(--secondary)]">{h.tag}</td>
                                    <td>{h.usageCount}</td>
                                    <td>{h.avgEngagement.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
