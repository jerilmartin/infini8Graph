'use client';

import { useQuery } from '@tanstack/react-query';
import { instagramApi } from '@/lib/api';
import { Clock, Zap, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export default function BestTimePage() {
    const { data, isLoading } = useQuery({
        queryKey: ['best-time'],
        queryFn: async () => {
            const res = await instagramApi.getBestTime();
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

    const hourlyAnalysis = data?.hourlyAnalysis || [];
    const dailyAnalysis = data?.dailyAnalysis || [];
    const recommendations = data?.recommendations || {};

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Best Time to Post</h1>
                <p className="text-[var(--muted)]">Optimize your posting schedule for maximum engagement</p>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                            <Clock size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Best Hours</h3>
                            <p className="text-sm text-[var(--muted)]">Peak engagement times</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.bestHours?.map((hour: number) => (
                            <span key={hour} className="px-4 py-2 rounded-full bg-[var(--primary)] text-white font-medium">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
                            <Calendar size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Best Days</h3>
                            <p className="text-sm text-[var(--muted)]">Top performing days</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.bestDays?.map((day: string) => (
                            <span key={day} className="px-4 py-2 rounded-full bg-[var(--secondary)] text-white font-medium">
                                {day}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2) 0%, rgba(244, 114, 182, 0.05) 100%)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                            <Zap size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Optimal Times</h3>
                            <p className="text-sm text-[var(--muted)]">Recommended posting</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {recommendations.optimalPostingTimes?.map((time: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="font-medium">{time.formatted}</span>
                                <span className="text-sm text-[var(--muted)]">{time.engagement} avg eng</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hourly Chart */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Engagement by Hour</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyAnalysis}>
                        <XAxis
                            dataKey="hour"
                            stroke="#71717a"
                            fontSize={12}
                            tickFormatter={(val) => `${val}:00`}
                        />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }}
                            labelFormatter={(val) => `${val}:00`}
                        />
                        <Bar
                            dataKey="avgEngagement"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Daily Chart */}
            <div className="chart-container">
                <h3 className="text-lg font-semibold mb-6">Engagement by Day of Week</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={dailyAnalysis}>
                        <PolarGrid stroke="#2a2a3a" />
                        <PolarAngleAxis dataKey="day" stroke="#71717a" fontSize={12} />
                        <Radar
                            name="Engagement"
                            dataKey="avgEngagement"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.3}
                        />
                        <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8 }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Analysis Info */}
            <div className="card text-center">
                <p className="text-[var(--muted)]">
                    Analysis based on <span className="text-[var(--foreground)] font-medium">{data?.postsAnalyzed || 0}</span> posts
                </p>
            </div>
        </div>
    );
}
