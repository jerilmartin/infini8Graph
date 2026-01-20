'use client';

import { useState } from 'react';
import { instagramApi } from '@/lib/api';
import { Download, FileJson, FileText, Check } from 'lucide-react';

const exportOptions = [
    { id: 'overview', label: 'Overview', description: 'Profile and summary metrics' },
    { id: 'growth', label: 'Growth', description: 'Growth trends and weekly stats' },
    { id: 'posts', label: 'Posts', description: 'All posts with engagement data' },
    { id: 'reels', label: 'Reels', description: 'Reels performance metrics' },
    { id: 'bestTime', label: 'Best Time', description: 'Optimal posting schedule' },
    { id: 'hashtags', label: 'Hashtags', description: 'Hashtag performance analysis' },
];

export default function ExportPage() {
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['overview', 'growth', 'posts']);
    const [format, setFormat] = useState<'json' | 'csv'>('json');
    const [loading, setLoading] = useState(false);

    const toggleMetric = (id: string) => {
        setSelectedMetrics(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleExport = async () => {
        if (selectedMetrics.length === 0) return;

        setLoading(true);
        try {
            const response = await instagramApi.exportData(format, selectedMetrics.join(','));

            if (format === 'csv') {
                // Download as file
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `infini8graph-export-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Download JSON
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `infini8graph-export-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold mb-2">Export Data</h1>
                <p className="text-[var(--muted)]">Download your analytics data for external analysis</p>
            </div>

            {/* Format Selection */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Export Format</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setFormat('json')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${format === 'json'
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-[var(--border)] hover:border-[var(--muted)]'
                            }`}
                    >
                        <FileJson size={32} className={format === 'json' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                        <div className="text-left">
                            <div className="font-semibold">JSON</div>
                            <div className="text-sm text-[var(--muted)]">Structured data format</div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFormat('csv')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${format === 'csv'
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-[var(--border)] hover:border-[var(--muted)]'
                            }`}
                    >
                        <FileText size={32} className={format === 'csv' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                        <div className="text-left">
                            <div className="font-semibold">CSV</div>
                            <div className="text-sm text-[var(--muted)]">Spreadsheet compatible</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Metrics Selection */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Select Data to Export</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exportOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => toggleMetric(option.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${selectedMetrics.includes(option.id)
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                    : 'border-[var(--border)] hover:border-[var(--muted)]'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedMetrics.includes(option.id)
                                    ? 'bg-[var(--primary)]'
                                    : 'bg-[var(--border)]'
                                }`}>
                                {selectedMetrics.includes(option.id) && <Check size={16} className="text-white" />}
                            </div>
                            <div>
                                <div className="font-semibold">{option.label}</div>
                                <div className="text-sm text-[var(--muted)]">{option.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={handleExport}
                disabled={loading || selectedMetrics.length === 0}
                className="btn btn-primary w-full py-4 text-lg"
            >
                {loading ? (
                    <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
                ) : (
                    <>
                        <Download size={20} />
                        Export {selectedMetrics.length} Dataset{selectedMetrics.length !== 1 ? 's' : ''} as {format.toUpperCase()}
                    </>
                )}
            </button>
        </div>
    );
}
