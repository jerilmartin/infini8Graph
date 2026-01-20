'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/lib/api';
import {
    Megaphone, IndianRupee, Eye, MousePointer, Users, RefreshCw, BarChart3,
    Play, Target, Layers, Image, TrendingUp, Clock, PieChart,
    ChevronRight, ExternalLink
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Helpers
function formatCurrency(value: string | number, currency = 'INR') {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(num / 100);
}

function formatNumber(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('en-IN');
}

function formatPercent(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return num.toFixed(2) + '%';
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];

// Components
function MetricCard({ label, value, icon: Icon, color, small }: {
    label: string; value: string | number; icon: React.ElementType; color: string; small?: boolean;
}) {
    return (
        <div className="metric-card">
            <div className="metric-icon" style={{ background: `${color}15`, color, width: small ? 32 : 40, height: small ? 32 : 40 }}>
                <Icon size={small ? 16 : 20} />
            </div>
            <div className="metric-value" style={{ fontSize: small ? 18 : 24, color }}>{value}</div>
            <div className="metric-label">{label}</div>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="btn btn-sm"
            style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'white' : 'var(--muted)',
                border: active ? 'none' : '1px solid var(--border)'
            }}
        >
            {children}
        </button>
    );
}

function AccountSelector({ accounts, selected, onSelect }: {
    accounts: any[]; selected: string; onSelect: (id: string) => void
}) {
    const activeAccounts = accounts.filter(a => a.insights?.spend);

    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {activeAccounts.slice(0, 5).map(account => (
                <button
                    key={account.id}
                    onClick={() => onSelect(account.account_id)}
                    className="btn btn-sm"
                    style={{
                        background: selected === account.account_id ? 'var(--primary)' : 'white',
                        color: selected === account.account_id ? 'white' : 'var(--foreground)',
                        border: '1px solid var(--border)'
                    }}
                >
                    {account.name}
                </button>
            ))}
        </div>
    );
}

// Main Page
export default function AdsPage() {
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'demographics' | 'placements'>('overview');

    // Fetch accounts
    const { data: accountsData, isLoading: accountsLoading } = useQuery({
        queryKey: ['ad-accounts'],
        queryFn: async () => {
            const res = await adsApi.getAdAccounts();
            return res.data;
        }
    });

    const adAccounts = accountsData?.data?.adAccounts || [];

    // Auto-select first account with data
    const effectiveAccount = selectedAccount || adAccounts.find((a: any) => a.insights?.spend)?.account_id;

    // Fetch detailed insights
    const { data: insightsData, isLoading: insightsLoading } = useQuery({
        queryKey: ['ad-insights', effectiveAccount],
        queryFn: async () => {
            if (!effectiveAccount) return null;
            const res = await adsApi.getAdInsights(effectiveAccount);
            return res.data;
        },
        enabled: !!effectiveAccount
    });

    // Fetch campaigns
    const { data: campaignsData } = useQuery({
        queryKey: ['campaigns', effectiveAccount],
        queryFn: async () => {
            if (!effectiveAccount) return null;
            const res = await adsApi.getCampaigns(effectiveAccount);
            return res.data;
        },
        enabled: !!effectiveAccount && activeTab === 'campaigns'
    });

    if (accountsLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p className="text-muted">Loading ad accounts...</p>
                </div>
            </div>
        );
    }

    const summary = insightsData?.data?.summary || {};
    const daily = insightsData?.data?.daily || [];
    const demographics = insightsData?.data?.demographics || [];
    const placements = insightsData?.data?.placements || [];
    const videoViews = insightsData?.data?.videoViews || {};
    const conversions = insightsData?.data?.conversions || [];
    const campaigns = campaignsData?.data?.campaigns || [];

    // Prepare chart data
    const dailyChartData = daily.map((d: any) => ({
        date: new Date(d.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        spend: parseFloat(d.spend || 0) / 100,
        impressions: parseInt(d.impressions || 0),
        clicks: parseInt(d.clicks || 0)
    }));

    const placementChartData = placements.map((p: any) => ({
        name: p.publisher_platform === 'instagram' ? 'Instagram' : p.publisher_platform === 'facebook' ? 'Facebook' : p.publisher_platform,
        spend: parseFloat(p.spend || 0) / 100,
        impressions: parseInt(p.impressions || 0)
    }));

    // Calculate totals from all accounts
    const totals = adAccounts.reduce((acc: any, account: any) => {
        if (account.insights) {
            acc.spend += parseFloat(account.insights.spend || 0);
            acc.impressions += parseInt(account.insights.impressions || 0);
            acc.reach += parseInt(account.insights.reach || 0);
            acc.clicks += parseInt(account.insights.clicks || 0);
        }
        return acc;
    }, { spend: 0, impressions: 0, reach: 0, clicks: 0 });

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 16 }}>
                <h1 className="page-title">Ads Analytics</h1>
                <p className="page-subtitle">Facebook & Instagram advertising performance (Last 90 days)</p>
            </div>

            {/* Account Selector */}
            {adAccounts.length > 0 && (
                <AccountSelector
                    accounts={adAccounts}
                    selected={effectiveAccount || ''}
                    onSelect={setSelectedAccount}
                />
            )}

            {/* Summary Metrics */}
            <div className="grid-metrics" style={{ marginBottom: 24 }}>
                <MetricCard label="Total Spend" value={formatCurrency(totals.spend)} icon={IndianRupee} color="#10b981" />
                <MetricCard label="Impressions" value={formatNumber(totals.impressions)} icon={Eye} color="#0ea5e9" />
                <MetricCard label="Reach" value={formatNumber(totals.reach)} icon={Users} color="#8b5cf6" />
                <MetricCard label="Clicks" value={formatNumber(totals.clicks)} icon={MousePointer} color="#f59e0b" />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                    <BarChart3 size={14} /> Overview
                </TabButton>
                <TabButton active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')}>
                    <Target size={14} /> Campaigns
                </TabButton>
                <TabButton active={activeTab === 'demographics'} onClick={() => setActiveTab('demographics')}>
                    <Users size={14} /> Demographics
                </TabButton>
                <TabButton active={activeTab === 'placements'} onClick={() => setActiveTab('placements')}>
                    <Layers size={14} /> Placements
                </TabButton>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {/* Performance Metrics */}
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Performance Metrics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <div>
                                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>CPM</div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(parseFloat(summary.cpm || 0) * 100)}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Cost per 1K impressions</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>CPC</div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(parseFloat(summary.cpc || 0) * 100)}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Cost per click</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>CTR</div>
                                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)' }}>{formatPercent(summary.ctr)}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Click-through rate</div>
                            </div>
                            <div>
                                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Frequency</div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{parseFloat(summary.frequency || 0).toFixed(2)}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Avg times shown</div>
                            </div>
                        </div>
                    </div>

                    {/* Daily Trend Chart */}
                    {dailyChartData.length > 0 && (
                        <div className="card">
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Daily Trends</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={dailyChartData}>
                                    <defs>
                                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        formatter={(value: any, name: string) => [
                                            name === 'spend' ? `₹${value.toLocaleString()}` : value.toLocaleString(),
                                            name === 'spend' ? 'Spend' : name === 'impressions' ? 'Impressions' : 'Clicks'
                                        ]}
                                        contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
                                    />
                                    <Area type="monotone" dataKey="spend" stroke="#10b981" fill="url(#spendGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Video Views & Conversions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Video Views */}
                        <div className="card">
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                                <Play size={16} style={{ marginRight: 8 }} /> Video Views
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                <div style={{ padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                                    <div className="text-muted" style={{ fontSize: 11 }}>25% watched</div>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{formatNumber(videoViews.views_25)}</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                                    <div className="text-muted" style={{ fontSize: 11 }}>50% watched</div>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{formatNumber(videoViews.views_50)}</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                                    <div className="text-muted" style={{ fontSize: 11 }}>75% watched</div>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{formatNumber(videoViews.views_75)}</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                                    <div className="text-muted" style={{ fontSize: 11 }}>100% watched</div>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{formatNumber(videoViews.views_100)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Conversions */}
                        <div className="card">
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                                <Target size={16} style={{ marginRight: 8 }} /> Conversions
                            </h3>
                            {conversions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {conversions.slice(0, 5).map((c: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{c.type.replace(/_/g, ' ')}</span>
                                            <span style={{ fontWeight: 600 }}>{formatNumber(c.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No conversion data available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'campaigns' && (
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Campaigns ({campaigns.length})</h3>
                    {campaigns.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Status</th>
                                    <th>Spend</th>
                                    <th>Impressions</th>
                                    <th>Clicks</th>
                                    <th>CTR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c: any) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                                        <td>
                                            <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(c.insights?.data?.[0]?.spend || 0)}</td>
                                        <td>{formatNumber(c.insights?.data?.[0]?.impressions || 0)}</td>
                                        <td>{formatNumber(c.insights?.data?.[0]?.clicks || 0)}</td>
                                        <td>{formatPercent(c.insights?.data?.[0]?.ctr || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-muted">No campaigns found for this account</p>
                    )}
                </div>
            )}

            {activeTab === 'demographics' && (
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Demographics</h3>
                    {demographics.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Age/Gender</th>
                                    <th>Spend</th>
                                    <th>Impressions</th>
                                    <th>Reach</th>
                                    <th>Clicks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demographics.slice(0, 10).map((d: any, i: number) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{d.age} {d.gender}</td>
                                        <td>{formatCurrency(d.spend)}</td>
                                        <td>{formatNumber(d.impressions)}</td>
                                        <td>{formatNumber(d.reach)}</td>
                                        <td>{formatNumber(d.clicks)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-muted">No demographic data available</p>
                    )}
                </div>
            )}

            {activeTab === 'placements' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Spend by Platform</h3>
                        {placementChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <RechartsPie>
                                    <Pie
                                        data={placementChartData}
                                        dataKey="spend"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {placementChartData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted">No placement data available</p>
                        )}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Platform Breakdown</h3>
                        {placements.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {placements.map((p: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.publisher_platform}</div>
                                            <div className="text-muted" style={{ fontSize: 12 }}>{formatNumber(p.impressions)} impressions</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(p.spend)}</div>
                                            <div className="text-muted" style={{ fontSize: 12 }}>{formatNumber(p.clicks)} clicks</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No placement data available</p>
                        )}
                    </div>
                </div>
            )}

            {/* All Accounts List */}
            <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                    All Ad Accounts ({adAccounts.length})
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                    {adAccounts.slice(0, 10).map((account: any) => (
                        <div
                            key={account.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: account.account_id === effectiveAccount ? 'var(--primary)' : 'var(--background)',
                                color: account.account_id === effectiveAccount ? 'white' : 'inherit',
                                borderRadius: 8,
                                cursor: 'pointer'
                            }}
                            onClick={() => setSelectedAccount(account.account_id)}
                        >
                            <div>
                                <div style={{ fontWeight: 500 }}>{account.name}</div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{account.currency}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600 }}>
                                    {account.insights?.spend ? formatCurrency(account.insights.spend, account.currency) : '—'}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    {account.insights?.impressions ? formatNumber(account.insights.impressions) + ' imp' : 'No data'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
