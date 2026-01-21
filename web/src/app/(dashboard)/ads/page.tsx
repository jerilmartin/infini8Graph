'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/lib/api';
import {
    Megaphone, IndianRupee, Eye, MousePointer, Users, BarChart3,
    Play, Target, Layers, TrendingUp, HelpCircle, Smartphone, Monitor,
    Globe, MapPin, Award, Zap, DollarSign, ExternalLink, ChevronDown, ChevronUp,
    Filter, Calendar, Clock, ArrowRight, ShoppingCart, CreditCard, Package, Brain
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

// ==================== HELPERS ====================

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

function formatRoas(value: number | string) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!num || isNaN(num) || num === 0) return '0x';
    return num.toFixed(2) + 'x';
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];

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
                    width: 220,
                    zIndex: 100,
                    marginBottom: 6,
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {text}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderWidth: 6,
                        borderStyle: 'solid',
                        borderColor: '#1e293b transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    );
}

// ==================== METRIC CARDS ====================

function MetricCard({ label, value, icon: Icon, color, tooltip }: {
    label: string; value: string | number; icon: React.ElementType; color: string; tooltip?: string;
}) {
    return (
        <div className="metric-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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

// ==================== SECTION COMPONENTS ====================

function SectionCard({ title, subtitle, children, collapsible = false, defaultOpen = true }: {
    title: string; subtitle?: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="card" style={{ marginBottom: 20 }}>
            <div
                className="card-header"
                style={{ cursor: collapsible ? 'pointer' : 'default', marginBottom: open ? 16 : 0 }}
                onClick={() => collapsible && setOpen(!open)}
            >
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {title}
                    </h3>
                    {subtitle && <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
                </div>
                {collapsible && (open ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
            </div>
            {open && children}
        </div>
    );
}

function RankingBadge({ value, type }: { value: string; type: 'quality' | 'engagement' | 'conversion' }) {
    const normalizedValue = (value || 'UNKNOWN').toUpperCase();
    const isUnknown = normalizedValue === 'UNKNOWN' || normalizedValue === '' || normalizedValue === 'N/A';
    const isGood = normalizedValue.includes('ABOVE') || normalizedValue === 'AVERAGE';
    const isBad = normalizedValue.includes('BELOW');

    const bgColor = isUnknown ? '#f1f5f9' : isGood ? '#dcfce7' : isBad ? '#fee2e2' : '#fef3c7';
    const textColor = isUnknown ? '#64748b' : isGood ? '#166534' : isBad ? '#991b1b' : '#92400e';

    // Format the display text
    let displayText = 'Not Available';
    if (!isUnknown) {
        displayText = value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        // Clean up common patterns
        displayText = displayText
            .replace('Below Average 10', 'Below Avg (Bottom 10%)')
            .replace('Below Average 20', 'Below Avg (Bottom 20%)')
            .replace('Below Average 35', 'Below Avg (Bottom 35%)')
            .replace('Above Average', 'Above Average')
            .replace('Average', 'Average');
    }

    return (
        <span style={{
            background: bgColor,
            color: textColor,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            display: 'inline-block'
        }}>
            {displayText}
        </span>
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

// ==================== MAIN PAGE ====================

export default function AdsPage() {
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'intelligence' | 'campaigns' | 'demographics' | 'placements' | 'geo'>('overview');

    // Fetch accounts
    const { data: accountsData, isLoading: accountsLoading } = useQuery({
        queryKey: ['ad-accounts'],
        queryFn: async () => {
            const res = await adsApi.getAdAccounts();
            return res.data;
        }
    });

    const adAccounts = accountsData?.data?.adAccounts || [];
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

    // Fetch conversion funnel
    const { data: funnelData, isLoading: funnelLoading } = useQuery({
        queryKey: ['funnel', effectiveAccount],
        queryFn: async () => {
            if (!effectiveAccount) return null;
            const res = await adsApi.getConversionFunnel(effectiveAccount);
            return res.data;
        },
        enabled: !!effectiveAccount && activeTab === 'funnel'
    });

    // Fetch campaign intelligence
    const { data: intelligenceData, isLoading: intelligenceLoading } = useQuery({
        queryKey: ['intelligence', effectiveAccount],
        queryFn: async () => {
            if (!effectiveAccount) return null;
            const res = await adsApi.getCampaignIntelligence(effectiveAccount);
            return res.data;
        },
        enabled: !!effectiveAccount && activeTab === 'intelligence'
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

    // Extract data from insights
    const summary = insightsData?.data?.summary || {};
    const relevanceDiagnostics = insightsData?.data?.relevanceDiagnostics || {};
    const roas = insightsData?.data?.roas || {};
    const clickMetrics = insightsData?.data?.clickMetrics || {};
    const daily = insightsData?.data?.daily || [];
    const demographics = insightsData?.data?.demographics || [];
    const placements = insightsData?.data?.placements || [];
    const devices = insightsData?.data?.devices || [];
    const positions = insightsData?.data?.positions || [];
    const countries = insightsData?.data?.countries || [];
    const regions = insightsData?.data?.regions || [];
    const videoViews = insightsData?.data?.videoViews || {};
    const conversions = insightsData?.data?.conversions || [];
    const actionValues = insightsData?.data?.actionValues || [];
    const costPerAction = insightsData?.data?.costPerAction || [];
    const campaigns = campaignsData?.data?.campaigns || [];

    // Chart data
    const dailyChartData = daily.map((d: any) => ({
        date: new Date(d.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        spend: parseFloat(d.spend || 0) / 100,
        impressions: parseInt(d.impressions || 0),
        clicks: parseInt(d.clicks || 0),
        ctr: parseFloat(d.ctr || 0)
    }));

    const deviceChartData = devices.map((d: any) => ({
        name: d.device_platform === 'mobile_app' ? 'Mobile' : d.device_platform === 'desktop' ? 'Desktop' : d.device_platform,
        spend: parseFloat(d.spend || 0) / 100,
        impressions: parseInt(d.impressions || 0)
    }));

    const positionChartData = positions.slice(0, 8).map((p: any) => ({
        name: `${p.publisher_platform || ''} ${p.platform_position || ''}`.replace(/_/g, ' ').trim(),
        spend: parseFloat(p.spend || 0) / 100,
        impressions: parseInt(p.impressions || 0),
        ctr: parseFloat(p.ctr || 0)
    }));

    // Totals across accounts
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
            <div className="page-header" style={{ marginBottom: 20 }}>
                <h1 className="page-title">Ads Analytics</h1>
                <p className="page-subtitle">Facebook & Instagram advertising performance (Last 90 days)</p>
            </div>

            {/* Account Selector */}
            {adAccounts.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                    {adAccounts.filter((a: any) => a.insights?.spend).slice(0, 5).map((account: any) => (
                        <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account.account_id)}
                            className="btn btn-sm"
                            style={{
                                background: effectiveAccount === account.account_id ? 'var(--primary)' : 'white',
                                color: effectiveAccount === account.account_id ? 'white' : 'var(--foreground)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            {account.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Summary Metrics */}
            <div className="grid-metrics" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                <MetricCard
                    label="Total Spend"
                    value={formatCurrency(summary.spend)}
                    icon={IndianRupee}
                    color="#10b981"
                    tooltip="Total amount spent on ads for this account"
                />
                <MetricCard
                    label="Impressions"
                    value={formatNumber(summary.impressions)}
                    icon={Eye}
                    color="#0ea5e9"
                    tooltip="Number of times your ads were shown on screen"
                />
                <MetricCard
                    label="Reach"
                    value={formatNumber(summary.reach)}
                    icon={Users}
                    color="#8b5cf6"
                    tooltip="Number of unique people who saw your ads"
                />
                <MetricCard
                    label="Clicks"
                    value={formatNumber(summary.clicks)}
                    icon={MousePointer}
                    color="#f59e0b"
                    tooltip="Number of clicks on your ads"
                />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                    <BarChart3 size={14} /> Overview
                </TabButton>
                <TabButton active={activeTab === 'funnel'} onClick={() => setActiveTab('funnel')}>
                    <Filter size={14} /> Funnel
                </TabButton>
                <TabButton active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')}>
                    <Brain size={14} /> Intelligence
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
                <TabButton active={activeTab === 'geo'} onClick={() => setActiveTab('geo')}>
                    <Globe size={14} /> Geography
                </TabButton>
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gap: 20 }}>

                    {/* Ad Relevance Diagnostics */}
                    <SectionCard
                        title="Ad Relevance Diagnostics"
                        subtitle={`Aggregated from ${relevanceDiagnostics.adsWithData || 0} of ${relevanceDiagnostics.adsAnalyzed || 0} ads with ranking data`}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <Award size={16} style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>Quality Ranking</span>
                                    <InfoTooltip text="Measures perceived ad quality based on user feedback like hiding or reporting ads, and positive signals like watch time" />
                                </div>
                                <RankingBadge value={relevanceDiagnostics.qualityRanking || 'N/A'} type="quality" />
                            </div>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <Zap size={16} style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>Engagement Ranking</span>
                                    <InfoTooltip text="Expected engagement rate (likes, comments, shares, clicks) compared to other ads competing for the same audience" />
                                </div>
                                <RankingBadge value={relevanceDiagnostics.engagementRateRanking || 'N/A'} type="engagement" />
                            </div>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <Target size={16} style={{ color: '#10b981' }} />
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>Conversion Ranking</span>
                                    <InfoTooltip text="Expected conversion rate compared to ads with similar optimization goals targeting the same audience" />
                                </div>
                                <RankingBadge value={relevanceDiagnostics.conversionRateRanking || 'N/A'} type="conversion" />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ROAS & Value Metrics */}
                    <SectionCard
                        title="ROAS & Value Metrics"
                        subtitle={roas.purchaseRoas > 0 || roas.websitePurchaseRoas > 0
                            ? "Return on ad spend and monetary value from conversions"
                            : "No purchase tracking detected - showing available metrics"
                        }
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>Purchase ROAS</span>
                                    <InfoTooltip text="Return on ad spend for purchases. Requires Meta Pixel with purchase event tracking." />
                                </div>
                                {roas.purchaseRoas > 0 ? (
                                    <div style={{ fontSize: 24, fontWeight: 700, color: roas.purchaseRoas > 1 ? '#10b981' : 'var(--foreground)' }}>
                                        {formatRoas(roas.purchaseRoas)}
                                    </div>
                                ) : (
                                    <div>
                                        <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>No Data</span>
                                        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Needs Pixel purchase tracking</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>Website ROAS</span>
                                    <InfoTooltip text="Return on ad spend specifically from website purchases" />
                                </div>
                                {roas.websitePurchaseRoas > 0 ? (
                                    <div style={{ fontSize: 24, fontWeight: 700, color: roas.websitePurchaseRoas > 1 ? '#10b981' : 'var(--foreground)' }}>
                                        {formatRoas(roas.websitePurchaseRoas)}
                                    </div>
                                ) : (
                                    <div>
                                        <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>No Data</span>
                                        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Needs Pixel purchase tracking</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>Outbound Clicks</span>
                                    <InfoTooltip text="Clicks that take people off Facebook/Instagram to your website or app" />
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatNumber(clickMetrics.outboundClicks)}</div>
                            </div>
                            <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>Social Spend</span>
                                    <InfoTooltip text="Budget spent on impressions from social actions (likes, shares, comments creating organic reach)" />
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(parseFloat(clickMetrics.socialSpend || 0) * 100)}</div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Performance Metrics */}
                    <SectionCard title="Performance Metrics" subtitle="Key performance indicators for your ads">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>CPM</span>
                                    <InfoTooltip text="Cost per 1,000 impressions. Lower is better for awareness campaigns" />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(parseFloat(summary.cpm || 0) * 100)}</div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>CPC</span>
                                    <InfoTooltip text="Cost per click. Lower is better for traffic campaigns" />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(parseFloat(summary.cpc || 0) * 100)}</div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>CTR</span>
                                    <InfoTooltip text="Click-through rate. Higher is better - indicates engaging ads" />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)' }}>{formatPercent(summary.ctr)}</div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span className="text-muted" style={{ fontSize: 12 }}>Frequency</span>
                                    <InfoTooltip text="Average times each person saw your ad. High frequency may cause ad fatigue" />
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 600 }}>{parseFloat(summary.frequency || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Daily Trend Chart */}
                    {dailyChartData.length > 0 && (
                        <SectionCard title="Daily Spend Trend" subtitle="How your ad spend varied over time">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={dailyChartData}>
                                    <defs>
                                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
                                    />
                                    <Area type="monotone" dataKey="spend" stroke="#10b981" fill="url(#spendGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    )}

                    {/* Video Retention & Conversions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <SectionCard title="Video Retention" subtitle="How much of your videos people watched">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                {[
                                    { label: '25% watched', value: videoViews.views_25 },
                                    { label: '50% watched', value: videoViews.views_50 },
                                    { label: '75% watched', value: videoViews.views_75 },
                                    { label: '100% watched', value: videoViews.views_100 }
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                                        <div className="text-muted" style={{ fontSize: 11 }}>{item.label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 600 }}>{formatNumber(item.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Conversions" subtitle="Actions people took after seeing your ads">
                            {conversions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {conversions.slice(0, 5).map((c: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{c.type.replace(/_/g, ' ')}</span>
                                            <span style={{ fontWeight: 600 }}>{formatNumber(c.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No conversion data available</p>
                            )}
                        </SectionCard>
                    </div>

                    {/* Device Performance */}
                    {deviceChartData.length > 0 && (
                        <SectionCard title="Device Performance" subtitle="How your ads perform on different devices">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RechartsPie>
                                        <Pie
                                            data={deviceChartData}
                                            dataKey="spend"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={70}
                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {deviceChartData.map((_: any, i: number) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                                    {devices.map((d: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {d.device_platform === 'mobile_app' ? <Smartphone size={18} /> : <Monitor size={18} />}
                                                <span style={{ textTransform: 'capitalize' }}>{d.device_platform?.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>{formatCurrency(d.spend)}</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{formatNumber(d.impressions)} imp</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>
                    )}
                </div>
            )}

            {/* ==================== CAMPAIGNS TAB ==================== */}
            {activeTab === 'campaigns' && (
                <SectionCard title={`Campaigns (${campaigns.length})`} subtitle="All campaigns in this ad account">
                    {campaigns.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
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
                                            <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</td>
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
                        </div>
                    ) : (
                        <p className="text-muted">No campaigns found for this account</p>
                    )}
                </SectionCard>
            )}

            {/* ==================== DEMOGRAPHICS TAB ==================== */}
            {activeTab === 'demographics' && (
                <SectionCard title="Demographics" subtitle="Breakdown by age and gender">
                    {demographics.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Age / Gender</th>
                                        <th>Spend</th>
                                        <th>Impressions</th>
                                        <th>Reach</th>
                                        <th>Clicks</th>
                                        <th>CTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demographics.slice(0, 15).map((d: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 500 }}>{d.age} {d.gender}</td>
                                            <td>{formatCurrency(d.spend)}</td>
                                            <td>{formatNumber(d.impressions)}</td>
                                            <td>{formatNumber(d.reach)}</td>
                                            <td>{formatNumber(d.clicks)}</td>
                                            <td>{formatPercent(d.ctr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted">No demographic data available</p>
                    )}
                </SectionCard>
            )}

            {/* ==================== PLACEMENTS TAB ==================== */}
            {activeTab === 'placements' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {/* Platform Breakdown */}
                    <SectionCard title="Platform Breakdown" subtitle="Performance on Facebook vs Instagram">
                        {placements.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                {placements.map((p: any, i: number) => (
                                    <div key={i} style={{ padding: 16, background: 'var(--background)', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 8 }}>{p.publisher_platform}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                                            <div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>Spend</div>
                                                <div style={{ fontWeight: 500 }}>{formatCurrency(p.spend)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>Impressions</div>
                                                <div style={{ fontWeight: 500 }}>{formatNumber(p.impressions)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>Clicks</div>
                                                <div style={{ fontWeight: 500 }}>{formatNumber(p.clicks)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>CTR</div>
                                                <div style={{ fontWeight: 500 }}>{formatPercent(p.ctr)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No platform data available</p>
                        )}
                    </SectionCard>

                    {/* Position Breakdown */}
                    <SectionCard title="Position Breakdown" subtitle="Performance by placement (Feed, Stories, Reels, etc.)">
                        {positions.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Position</th>
                                            <th>Spend</th>
                                            <th>Impressions</th>
                                            <th>Clicks</th>
                                            <th>CTR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.slice(0, 10).map((p: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                                    {`${p.publisher_platform || ''} ${p.platform_position || ''}`.replace(/_/g, ' ')}
                                                </td>
                                                <td>{formatCurrency(p.spend)}</td>
                                                <td>{formatNumber(p.impressions)}</td>
                                                <td>{formatNumber(p.clicks)}</td>
                                                <td>{formatPercent(p.ctr)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted">No position data available</p>
                        )}
                    </SectionCard>
                </div>
            )}

            {/* ==================== GEOGRAPHY TAB ==================== */}
            {activeTab === 'geo' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {/* Country Breakdown */}
                    <SectionCard title="Country Performance" subtitle="How your ads perform in different countries">
                        {countries.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Country</th>
                                            <th>Spend</th>
                                            <th>Impressions</th>
                                            <th>Reach</th>
                                            <th>Clicks</th>
                                            <th>CTR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {countries.slice(0, 15).map((c: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Globe size={14} />
                                                        {c.country}
                                                    </div>
                                                </td>
                                                <td>{formatCurrency(c.spend)}</td>
                                                <td>{formatNumber(c.impressions)}</td>
                                                <td>{formatNumber(c.reach)}</td>
                                                <td>{formatNumber(c.clicks)}</td>
                                                <td>{formatPercent(c.ctr)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted">No country data available</p>
                        )}
                    </SectionCard>

                    {/* Region Breakdown */}
                    <SectionCard title="Region Performance" subtitle="Performance by state/region">
                        {regions.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Region</th>
                                            <th>Spend</th>
                                            <th>Impressions</th>
                                            <th>Reach</th>
                                            <th>Clicks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regions.slice(0, 15).map((r: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <MapPin size={14} />
                                                        {r.region}
                                                    </div>
                                                </td>
                                                <td>{formatCurrency(r.spend)}</td>
                                                <td>{formatNumber(r.impressions)}</td>
                                                <td>{formatNumber(r.reach)}</td>
                                                <td>{formatNumber(r.clicks)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted">No region data available</p>
                        )}
                    </SectionCard>
                </div>
            )}

            {/* ==================== FUNNEL TAB ==================== */}
            {activeTab === 'funnel' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {funnelLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                            <p className="text-muted">Loading funnel data...</p>
                        </div>
                    ) : funnelData?.data ? (
                        <>
                            {/* Funnel Summary */}
                            <SectionCard
                                title="Conversion Funnel Overview"
                                subtitle="Track user journey from landing page to purchase"
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                                        <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Total Spend</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                                            {formatCurrency(funnelData.data.summary?.totalSpend * 100 || 0)}
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                                        <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Overall Conversion</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>
                                            {funnelData.data.summary?.overallConversionRate || 0}%
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                                        <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>ROAS</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: funnelData.data.summary?.roas > 1 ? '#10b981' : '#f59e0b' }}>
                                            {funnelData.data.summary?.roas || 0}x
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--background)', borderRadius: 8, textAlign: 'center' }}>
                                        <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Cost/Purchase</div>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ec4899' }}>
                                            {formatCurrency(funnelData.data.summary?.costPerPurchase * 100 || 0)}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Visual Funnel */}
                            <SectionCard title="Conversion Funnel Visualization" subtitle="Watch where users drop off">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                    {(funnelData.data.funnel || []).map((stage: any, i: number) => {
                                        const maxCount = Math.max(...(funnelData.data.funnel || []).map((s: any) => s.count || 1));
                                        const width = stage.count > 0 ? Math.max(30, (stage.count / maxCount) * 100) : 30;
                                        const isBottleneck = funnelData.data.bottleneck?.stage === stage.label;

                                        const stageIcons: Record<string, React.ElementType> = {
                                            'Landing Page View': Eye,
                                            'View Content': Package,
                                            'Add To Cart': ShoppingCart,
                                            'Initiate Checkout': CreditCard,
                                            'Add Payment Info': CreditCard,
                                            'Purchase': DollarSign
                                        };
                                        const Icon = stageIcons[stage.label] || Target;

                                        return (
                                            <div key={stage.stage} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                {/* Stage Bar */}
                                                <div style={{
                                                    width: `${width}%`,
                                                    background: isBottleneck
                                                        ? 'linear-gradient(135deg, #ef4444, #f87171)'
                                                        : `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                                                    padding: '16px 20px',
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    color: 'white',
                                                    minWidth: 300,
                                                    boxShadow: isBottleneck ? '0 0 0 3px rgba(239, 68, 68, 0.3)' : 'none'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <Icon size={20} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{stage.label}</div>
                                                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                                                                {formatCurrency(stage.costPerAction * 100 || 0)} per action
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: 20, fontWeight: 700 }}>{formatNumber(stage.count)}</div>
                                                        {i > 0 && (
                                                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                                                                {stage.conversionRate}% from prev
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow with dropoff */}
                                                {i < (funnelData.data.funnel?.length || 0) - 1 && (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '8px 0',
                                                        color: stage.dropoffRate > 50 ? '#ef4444' : '#94a3b8'
                                                    }}>
                                                        <ArrowRight size={16} style={{ transform: 'rotate(90deg)' }} />
                                                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                                                            {stage.dropoffRate}% drop off
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottleneck Alert */}
                                {funnelData.data.bottleneck && (
                                    <div style={{
                                        marginTop: 24,
                                        padding: '16px 20px',
                                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))',
                                        borderRadius: 8,
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12
                                    }}>
                                        <Zap size={20} style={{ color: '#ef4444' }} />
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#ef4444' }}>Bottleneck Detected</div>
                                            <div style={{ fontSize: 13 }}>{funnelData.data.bottleneck.insight}</div>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <p className="text-muted">No funnel data available. Ensure you have purchase tracking set up.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== INTELLIGENCE TAB ==================== */}
            {activeTab === 'intelligence' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {intelligenceLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                            <p className="text-muted">Analyzing campaign data...</p>
                        </div>
                    ) : intelligenceData?.data ? (
                        <>
                            {/* AI Recommendations */}
                            {intelligenceData.data.recommendations && (
                                <SectionCard title="🎯 Smart Recommendations" subtitle="AI-powered insights for optimization">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                        {intelligenceData.data.recommendations.bestHour && (
                                            <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))', borderRadius: 8 }}>
                                                <Clock size={20} style={{ color: '#6366f1', marginBottom: 8 }} />
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Best Hour</div>
                                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{intelligenceData.data.recommendations.bestHour}</div>
                                            </div>
                                        )}
                                        {intelligenceData.data.recommendations.bestDay && (
                                            <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))', borderRadius: 8 }}>
                                                <Calendar size={20} style={{ color: '#10b981', marginBottom: 8 }} />
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Best Day</div>
                                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{intelligenceData.data.recommendations.bestDay}</div>
                                            </div>
                                        )}
                                        {intelligenceData.data.recommendations.bestPlacement && (
                                            <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(249, 115, 22, 0.1))', borderRadius: 8 }}>
                                                <Layers size={20} style={{ color: '#ec4899', marginBottom: 8 }} />
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Best Placement</div>
                                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{intelligenceData.data.recommendations.bestPlacement}</div>
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Day of Week Heatmap */}
                            {(intelligenceData.data.dayOfWeekPerformance || []).length > 0 && (
                                <SectionCard title="📅 Day of Week Performance" subtitle="Find your best performing days">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                                        {(intelligenceData.data.dayOfWeekPerformance || []).map((day: any) => {
                                            const maxCtr = Math.max(...(intelligenceData.data.dayOfWeekPerformance || []).map((d: any) => parseFloat(d.ctr) || 0));
                                            const intensity = maxCtr > 0 ? parseFloat(day.ctr) / maxCtr : 0;
                                            const bgColor = `rgba(99, 102, 241, ${0.1 + intensity * 0.6})`;

                                            return (
                                                <div key={day.day} style={{
                                                    padding: 16,
                                                    background: bgColor,
                                                    borderRadius: 8,
                                                    textAlign: 'center',
                                                    border: intensity > 0.8 ? '2px solid #6366f1' : 'none'
                                                }}>
                                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{day.day.slice(0, 3)}</div>
                                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{day.ctr}%</div>
                                                    <div className="text-muted" style={{ fontSize: 10 }}>CTR</div>
                                                    <div style={{ marginTop: 8, fontSize: 11 }}>
                                                        {formatNumber(day.avgClicks)} clicks
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Placement ROAS Matrix */}
                            {(intelligenceData.data.placementMatrix || []).length > 0 && (
                                <SectionCard title="📊 Placement ROAS Matrix" subtitle="Find your most profitable placements">
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Platform</th>
                                                    <th>Position</th>
                                                    <th>ROAS</th>
                                                    <th>Spend</th>
                                                    <th>Revenue</th>
                                                    <th>CPC</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(intelligenceData.data.placementMatrix || []).slice(0, 10).map((p: any, i: number) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{p.platform}</td>
                                                        <td style={{ textTransform: 'capitalize' }}>{(p.position || '').replace(/_/g, ' ')}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: 20,
                                                                background: parseFloat(p.roas) >= 1 ? '#dcfce7' : '#fee2e2',
                                                                color: parseFloat(p.roas) >= 1 ? '#166534' : '#991b1b',
                                                                fontWeight: 600,
                                                                fontSize: 13
                                                            }}>
                                                                {p.roas}x
                                                            </span>
                                                        </td>
                                                        <td>{formatCurrency(p.spend * 100)}</td>
                                                        <td>{formatCurrency(p.revenue * 100)}</td>
                                                        <td>{formatCurrency(parseFloat(p.cpc) * 100)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </SectionCard>
                            )}

                            {/* Top Campaigns by Efficiency */}
                            {(intelligenceData.data.campaigns || []).length > 0 && (
                                <SectionCard title="🏆 Top Campaigns by Efficiency" subtitle="Campaigns ranked by our efficiency score">
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {(intelligenceData.data.campaigns || []).slice(0, 5).map((c: any, i: number) => (
                                            <div key={c.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                                padding: 16,
                                                background: 'var(--background)',
                                                borderRadius: 8,
                                                borderLeft: `4px solid ${COLORS[i % COLORS.length]}`
                                            }}>
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: COLORS[i % COLORS.length],
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700
                                                }}>
                                                    {i + 1}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                                                        <span>Spend: {formatCurrency(c.spend * 100)}</span>
                                                        <span>Purchases: {c.purchases}</span>
                                                        <span>ROAS: {c.roas.toFixed(2)}x</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>{c.efficiencyScore}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Efficiency Score</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <p className="text-muted">No intelligence data available for this account.</p>
                        </div>
                    )}
                </div>
            )}

            {/* All Accounts Summary */}
            <SectionCard
                title={`All Ad Accounts (${adAccounts.length})`}
                subtitle="Overview of all connected ad accounts"
                collapsible
                defaultOpen={false}
            >
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
            </SectionCard>
        </div>
    );
}
