'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Heart, MessageCircle, Eye, Bookmark, Share2, Image } from 'lucide-react';

export default function EngagementPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const res = await instagramApi.getPosts(50);
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

    const posts = data?.all || [];
    const summary = data?.summary || {};

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Engagement Analytics</h1>
                <p className="text-[var(--muted)]">Detailed breakdown of your content performance</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="metric-card">
                    <Heart className="mb-3 text-[var(--danger)]" size={24} />
                    <div className="metric-value">{summary.totalEngagement?.toLocaleString() || 0}</div>
                    <div className="metric-label">Total Engagement</div>
                </div>
                <div className="metric-card">
                    <Eye className="mb-3 text-[var(--secondary)]" size={24} />
                    <div className="metric-value">{summary.totalReach?.toLocaleString() || 0}</div>
                    <div className="metric-label">Total Reach</div>
                </div>
                <div className="metric-card">
                    <Heart className="mb-3 text-[var(--accent)]" size={24} />
                    <div className="metric-value">{summary.avgEngagement?.toLocaleString() || 0}</div>
                    <div className="metric-label">Avg Engagement</div>
                </div>
                <div className="metric-card">
                    <Eye className="mb-3 text-[var(--primary)]" size={24} />
                    <div className="metric-value">{summary.avgReach?.toLocaleString() || 0}</div>
                    <div className="metric-label">Avg Reach</div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="card overflow-hidden p-0">
                <div className="p-6 border-b border-[var(--border)]">
                    <h3 className="text-lg font-semibold">All Posts ({posts.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Post</th>
                                <th>Type</th>
                                <th><Heart size={14} className="inline" /> Likes</th>
                                <th><MessageCircle size={14} className="inline" /> Comments</th>
                                <th><Eye size={14} className="inline" /> Reach</th>
                                <th><Bookmark size={14} className="inline" /> Saved</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post: any) => (
                                <tr key={post.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-[var(--border)] overflow-hidden flex-shrink-0">
                                                {post.thumbnail ? (
                                                    <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Image size={16} className="text-[var(--muted)]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="max-w-[200px] truncate text-sm">
                                                {post.caption || 'No caption'}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-success">{post.type}</span></td>
                                    <td className="font-medium">{post.likes?.toLocaleString()}</td>
                                    <td>{post.comments?.toLocaleString()}</td>
                                    <td>{post.reach?.toLocaleString()}</td>
                                    <td>{post.saved?.toLocaleString()}</td>
                                    <td className="text-[var(--muted)] text-sm">
                                        {new Date(post.timestamp).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
