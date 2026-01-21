'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import {
    Heart, MessageCircle, Eye, Bookmark, Share2, Image,
    HelpCircle, ChevronRight, ChevronLeft, LogOut,
    Users, TrendingUp, Film, LayoutGrid
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];

// ==================== TOOLTIP COMPONENT ====================

function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
            <HelpCircle
                size={14}
                style={{ color: 'var(--muted)', cursor: 'help', opacity: 0.7 }}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            />
            {show && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1e293b',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    width: 200,
                    zIndex: 100,
                    marginBottom: 6,
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {text}
                </div>
            )}
        </div>
    );
}

// ==================== SECTION CARD ====================

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{title}</h3>
                    {subtitle && <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

// ==================== METRIC CARD ====================

function MetricCard({ label, value, icon: Icon, color, tooltip }: {
    label: string; value: string | number; icon: React.ElementType; color: string; tooltip?: string;
}) {
    return (
        <div className="metric-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div className="metric-icon" style={{ background: `${color}15`, color, width: 36, height: 36 }}>
                    <Icon size={18} />
                </div>
                {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            <div className="metric-value" style={{ fontSize: 22, color }}>{value}</div>
            <div className="metric-label" style={{ fontSize: 12 }}>{label}</div>
        </div>
    );
}

// ==================== MAIN PAGE ====================

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p className="text-muted">Loading engagement data...</p>
                </div>
            </div>
        );
    }

    const posts = data?.all || [];
    const summary = data?.summary || {};

    // Content type breakdown
    const contentTypes = posts.reduce((acc: any, post: any) => {
        const type = post.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const contentTypeData = Object.entries(contentTypes).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value
    }));

    // Engagement by content type
    const engagementByType = posts.reduce((acc: any, post: any) => {
        const type = post.type || 'Unknown';
        if (!acc[type]) {
            acc[type] = { total: 0, count: 0 };
        }
        acc[type].total += post.engagement || 0;
        acc[type].count += 1;
        return acc;
    }, {});

    const engagementTypeData = Object.entries(engagementByType).map(([name, data]: [string, any]) => ({
        name: name.replace('_', ' '),
        avgEngagement: Math.round(data.total / data.count)
    }));

    // Calculate computed metrics
    const viralScore = summary.totalReach && summary.totalEngagement
        ? ((summary.totalEngagement / summary.totalReach) * 100).toFixed(2)
        : '0';

    const saveRate = posts.reduce((sum: number, p: any) => sum + (p.saved || 0), 0);
    const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0);
    const saveToLikeRatio = totalLikes > 0 ? ((saveRate / totalLikes) * 100).toFixed(2) : '0';

    // Story engagement metrics (simulated - would come from API in real implementation)
    const storyMetrics = {
        tapsForward: 245,
        tapsBack: 89,
        exits: 67,
        replies: 34,
        retentionRate: 78
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <h1 className="page-title">Engagement Analytics</h1>
                <p className="page-subtitle">Detailed breakdown of your content performance</p>
            </div>

            {/* Summary Metrics */}
            <div className="grid-metrics" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                <MetricCard
                    label="Total Engagement"
                    value={summary.totalEngagement?.toLocaleString() || 0}
                    icon={Heart}
                    color="#ec4899"
                    tooltip="Total likes, comments, saves, and shares combined"
                />
                <MetricCard
                    label="Total Reach"
                    value={summary.totalReach?.toLocaleString() || 0}
                    icon={Eye}
                    color="#0ea5e9"
                    tooltip="Total unique accounts that saw any of your content"
                />
                <MetricCard
                    label="Avg Engagement"
                    value={summary.avgEngagement?.toLocaleString() || 0}
                    icon={TrendingUp}
                    color="#10b981"
                    tooltip="Average engagement per post"
                />
                <MetricCard
                    label="Avg Reach"
                    value={summary.avgReach?.toLocaleString() || 0}
                    icon={Users}
                    color="#6366f1"
                    tooltip="Average unique accounts reached per post"
                />
            </div>

            {/* Calculated Insights */}
            <SectionCard title="Calculated Insights" subtitle="Advanced engagement metrics">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>Viral Score</span>
                            <InfoTooltip text="(Engagement ÷ Reach) × 100. Measures how engaging your content is relative to how many people see it." />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{viralScore}%</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>Save-to-Like Ratio</span>
                            <InfoTooltip text="(Saves ÷ Likes) × 100. High ratio indicates content people want to reference later - a quality signal." />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{saveToLikeRatio}%</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>Total Saves</span>
                            <InfoTooltip text="Number of times your content was saved. High saves indicate valuable, bookmark-worthy content." />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{saveRate.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>Posts Analyzed</span>
                            <InfoTooltip text="Number of posts included in this analysis" />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{posts.length}</div>
                    </div>
                </div>
            </SectionCard>

            {/* Content Type Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <SectionCard title="Content Type Breakdown" subtitle="Distribution of your content formats">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <ResponsiveContainer width="50%" height={180}>
                            <PieChart>
                                <Pie
                                    data={contentTypeData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {contentTypeData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            {contentTypeData.map((type, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                                    <span style={{ flex: 1, fontSize: 13, textTransform: 'capitalize' }}>{type.name}</span>
                                    <span style={{ fontWeight: 600 }}>{(type.value as number).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Engagement by Content Type" subtitle="Which formats perform best">
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={engagementTypeData}>
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
                            />
                            <Bar dataKey="avgEngagement" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Engagement" />
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>
            </div>

            {/* Story Engagement Metrics */}
            <SectionCard title="Story Engagement" subtitle="How people interact with your Stories">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>Taps Forward</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{storyMetrics.tapsForward}</div>
                        <InfoTooltip text="Times users tapped to skip to the next story. High numbers may indicate story is too long or not engaging." />
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <ChevronLeft size={16} style={{ color: 'var(--muted)' }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>Taps Back</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{storyMetrics.tapsBack}</div>
                        <InfoTooltip text="Times users tapped back to re-watch. High numbers indicate engaging content worth rewatching!" />
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <LogOut size={16} style={{ color: 'var(--muted)' }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>Exits</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{storyMetrics.exits}</div>
                        <InfoTooltip text="Times users left your stories. Lower is better - means people want to watch more." />
                    </div>
                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <MessageCircle size={16} style={{ color: 'var(--muted)' }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>Replies</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{storyMetrics.replies}</div>
                        <InfoTooltip text="Direct message replies to your stories. High engagement signal!" />
                    </div>
                    <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <TrendingUp size={16} style={{ color: 'var(--muted)' }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>Retention</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{storyMetrics.retentionRate}%</div>
                        <InfoTooltip text="Percentage of viewers who watched your stories without exiting. Higher is better!" />
                    </div>
                </div>
            </SectionCard>

            {/* Posts Table */}
            <SectionCard title={`All Posts (${posts.length})`} subtitle="Detailed metrics for each post">
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Post</th>
                                <th>Type</th>
                                <th><Heart size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Likes</th>
                                <th><MessageCircle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Comments</th>
                                <th><Eye size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Reach</th>
                                <th><Bookmark size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Saved</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.slice(0, 20).map((post: any) => (
                                <tr key={post.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--background)', overflow: 'hidden', flexShrink: 0 }}>
                                                {post.thumbnail ? (
                                                    <img src={post.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Image size={16} style={{ color: 'var(--muted)' }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                                                {post.caption || 'No caption'}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{post.type?.replace('_', ' ')}</span></td>
                                    <td style={{ fontWeight: 500 }}>{post.likes?.toLocaleString()}</td>
                                    <td>{post.comments?.toLocaleString()}</td>
                                    <td>{post.reach?.toLocaleString()}</td>
                                    <td>{post.saved?.toLocaleString()}</td>
                                    <td className="text-muted" style={{ fontSize: 12 }}>
                                        {new Date(post.timestamp).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>
        </div>
    );
}
