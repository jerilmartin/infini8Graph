'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface AutomationRule {
    id?: string;
    instagram_account_id?: string;
    media_id?: string | null;
    media_ids?: string[] | null;
    name: string;
    keywords: string[];
    comment_reply: string;
    dm_reply: string;
    send_dm: boolean;
    is_active: boolean;
}

interface MediaItem {
    id: string;
    media_url: string;
    caption: string;
}

export default function AutomationPage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [media, setMedia] = useState<MediaItem[]>([]);

    // Default rule
    const [defaultRule, setDefaultRule] = useState<AutomationRule>({
        name: 'Default Automation',
        keywords: [],
        comment_reply: '',
        dm_reply: '',
        send_dm: true,
        is_active: false,
        media_id: null,
        media_ids: []
    });

    // Override creation
    const [showCreate, setShowCreate] = useState(false);
    const [newRule, setNewRule] = useState<AutomationRule>({
        name: '',
        keywords: [],
        comment_reply: '',
        dm_reply: '',
        send_dm: true,
        is_active: true,
        media_id: null,
        media_ids: []
    });
    const [kwInput, setKwInput] = useState('');
    const [defaultKwInput, setDefaultKwInput] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesRes, mediaRes] = await Promise.all([
                fetch(`${API_BASE}/api/automation/rules`, { credentials: 'include' }),
                fetch(`${API_BASE}/api/instagram/posts?limit=100`, { credentials: 'include' })
            ]);

            if (rulesRes.ok) {
                const data = await rulesRes.json();
                const allRules: AutomationRule[] = data.rules || [];
                setRules(allRules);

                const def = allRules.find(r => !r.media_id && (!r.media_ids || r.media_ids.length === 0));
                if (def) setDefaultRule(def);
            }

            if (mediaRes.ok) {
                const data = await mediaRes.json();
                setMedia((data.data?.all || []).map((p: any) => ({
                    id: p.id,
                    media_url: p.thumbnail,
                    caption: p.caption || ''
                })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const specificRules = rules.filter(r => r.media_id || (r.media_ids && r.media_ids.length > 0));

    const notify = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const saveDefault = async () => {
        if (!defaultRule.comment_reply.trim()) {
            notify('error', 'Please enter a reply message');
            return;
        }
        setSaving(true);
        try {
            const method = defaultRule.id ? 'PATCH' : 'POST';
            const url = defaultRule.id
                ? `${API_BASE}/api/automation/rules/${defaultRule.id}`
                : `${API_BASE}/api/automation/rules`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...defaultRule,
                    name: 'Default Automation',
                    keywords: defaultRule.keywords || [],
                    media_id: null,
                    media_ids: []
                })
            });

            if (res.ok) {
                const data = await res.json();
                setDefaultRule(data.rule);
                notify('success', 'Default saved!');
                fetchData();
            } else {
                const err = await res.json();
                notify('error', err.error || 'Save failed');
            }
        } catch {
            notify('error', 'Network error');
        } finally {
            setSaving(false);
        }
    };

    const createOverride = async () => {
        if (!newRule.name.trim()) return notify('error', 'Enter a name');
        if (!newRule.media_ids?.length) return notify('error', 'Select at least one post');
        if (!newRule.comment_reply.trim()) return notify('error', 'Enter a reply');

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/automation/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newRule)
            });

            if (res.ok) {
                notify('success', 'Override created!');
                setShowCreate(false);
                setNewRule({ name: '', keywords: [], comment_reply: '', dm_reply: '', send_dm: true, is_active: true, media_id: null, media_ids: [] });
                fetchData();
            } else {
                notify('error', 'Failed to create');
            }
        } catch {
            notify('error', 'Network error');
        } finally {
            setSaving(false);
        }
    };

    const updateOverride = async (rule: AutomationRule) => {
        if (!rule.id) return;
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/automation/rules/${rule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(rule)
            });
            notify('success', 'Updated!');
            fetchData();
        } catch {
            notify('error', 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm('Delete this rule?')) return;
        try {
            await fetch(`${API_BASE}/api/automation/rules/${id}`, { method: 'DELETE', credentials: 'include' });
            fetchData();
        } catch { }
    };

    const togglePost = (id: string) => {
        const curr = newRule.media_ids || [];
        setNewRule({
            ...newRule,
            media_ids: curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
        });
    };

    const addKw = () => {
        if (!kwInput.trim()) return;
        // Split by comma or space, filter empty, make lowercase
        const newKws = kwInput.split(/[,\s]+/).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        const uniqueKws = [...new Set([...newRule.keywords, ...newKws])];
        setNewRule({ ...newRule, keywords: uniqueKws });
        setKwInput('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-2xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        Auto-Reply
                    </h1>
                    <p className="text-slate-500 mt-2 ml-[52px]">Automatically respond to Instagram comments</p>
                </div>

                {/* DEFAULT AUTOMATION CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">Default Reply</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Applies to all posts without a specific override</p>
                        </div>
                        <button
                            onClick={() => setDefaultRule({ ...defaultRule, is_active: !defaultRule.is_active })}
                            className={`relative w-12 h-6 rounded-full transition-all ${defaultRule.is_active ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${defaultRule.is_active ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Keywords (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Trigger Keywords <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={defaultKwInput}
                                    onChange={e => setDefaultKwInput(e.target.value)}
                                    onKeyPress={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (defaultKwInput.trim()) {
                                                // Split by comma or space, filter empty, make lowercase
                                                const newKws = defaultKwInput.split(/[,\s]+/).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
                                                const uniqueKws = [...new Set([...defaultRule.keywords, ...newKws])];
                                                setDefaultRule({ ...defaultRule, keywords: uniqueKws });
                                                setDefaultKwInput('');
                                            }
                                        }
                                    }}
                                    placeholder="Type keyword and press Enter (e.g. price)"
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                />
                                <button
                                    onClick={() => {
                                        if (defaultKwInput.trim()) {
                                            // Split by comma or space, filter empty, make lowercase
                                            const newKws = defaultKwInput.split(/[,\s]+/).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
                                            const uniqueKws = [...new Set([...defaultRule.keywords, ...newKws])];
                                            setDefaultRule({ ...defaultRule, keywords: uniqueKws });
                                            setDefaultKwInput('');
                                        }
                                    }}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm text-slate-700 font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[28px]">
                                {defaultRule.keywords.length === 0 ? (
                                    <span className="text-xs text-slate-500 italic">No keywords = replies to ALL comments</span>
                                ) : (
                                    defaultRule.keywords.map(k => (
                                        <span key={k} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1.5 font-medium">
                                            #{k}
                                            <button
                                                onClick={() => setDefaultRule({ ...defaultRule, keywords: defaultRule.keywords.filter(x => x !== k) })}
                                                className="hover:text-indigo-900"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Separate multiple keywords with commas or spaces. Case-insensitive.</p>
                        </div>

                        {/* Public Reply */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Public Reply
                            </label>
                            <textarea
                                value={defaultRule.comment_reply}
                                onChange={e => setDefaultRule({ ...defaultRule, comment_reply: e.target.value })}
                                placeholder="Thanks for commenting! Check your DMs 📩"
                                className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1.5">This is posted as a reply to the comment</p>
                        </div>

                        {/* DM Reply */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700">Private DM</label>
                                <button
                                    onClick={() => setDefaultRule({ ...defaultRule, send_dm: !defaultRule.send_dm })}
                                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${defaultRule.send_dm
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {defaultRule.send_dm ? '✓ Enabled' : 'Disabled'}
                                </button>
                            </div>
                            {defaultRule.send_dm && (
                                <textarea
                                    value={defaultRule.dm_reply}
                                    onChange={e => setDefaultRule({ ...defaultRule, dm_reply: e.target.value })}
                                    placeholder="Hey! Thanks for reaching out..."
                                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
                                />
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveDefault}
                            disabled={saving}
                            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            Save Default
                        </button>
                    </div>
                </div>

                {/* POST-SPECIFIC OVERRIDES CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">Post Overrides</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Custom replies for specific posts (take priority)</p>
                        </div>
                        {!showCreate && (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Override
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {/* Create Override Form */}
                        {showCreate && (
                            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 mb-5">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-semibold text-slate-900">New Override</h3>
                                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Rule Name</label>
                                        <input
                                            type="text"
                                            value={newRule.name}
                                            onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                            placeholder="e.g. Summer Sale"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Select Posts */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Posts
                                            {(newRule.media_ids?.length || 0) > 0 && (
                                                <span className="ml-2 text-indigo-600 font-normal">
                                                    ({newRule.media_ids?.length} selected)
                                                </span>
                                            )}
                                        </label>
                                        <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto bg-white rounded-lg p-2 border border-slate-200">
                                            {media.length === 0 ? (
                                                <p className="col-span-full text-center text-slate-400 text-sm py-6">No posts available</p>
                                            ) : (
                                                media.map(m => {
                                                    const selected = newRule.media_ids?.includes(m.id);
                                                    return (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => togglePost(m.id)}
                                                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-80'
                                                                }`}
                                                        >
                                                            <img src={m.media_url} className="w-full h-full object-cover" alt="" />
                                                            {selected && (
                                                                <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
                                                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Keywords <span className="text-slate-400 font-normal">(optional - leave empty to trigger on ALL comments)</span>
                                        </label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={kwInput}
                                                onChange={e => setKwInput(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && addKw()}
                                                placeholder="e.g. price"
                                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                            />
                                            <button onClick={addKw} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm text-slate-700">
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newRule.keywords.length === 0 ? (
                                                <span className="text-xs text-slate-500">Will trigger on all comments to selected posts</span>
                                            ) : (
                                                newRule.keywords.map(k => (
                                                    <span key={k} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1.5">
                                                        #{k}
                                                        <button onClick={() => setNewRule({ ...newRule, keywords: newRule.keywords.filter(x => x !== k) })}>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Public Reply</label>
                                            <textarea
                                                value={newRule.comment_reply}
                                                onChange={e => setNewRule({ ...newRule, comment_reply: e.target.value })}
                                                placeholder="Your reply..."
                                                className="w-full h-20 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-slate-700">Private DM</label>
                                                <button
                                                    onClick={() => setNewRule({ ...newRule, send_dm: !newRule.send_dm })}
                                                    className={`text-xs px-2 py-1 rounded ${newRule.send_dm ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {newRule.send_dm ? 'On' : 'Off'}
                                                </button>
                                            </div>
                                            {newRule.send_dm && (
                                                <textarea
                                                    value={newRule.dm_reply}
                                                    onChange={e => setNewRule({ ...newRule, dm_reply: e.target.value })}
                                                    placeholder="Your DM..."
                                                    className="w-full h-20 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Create Button */}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={createOverride}
                                            disabled={saving}
                                            className="px-5 py-2.5 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                            Create Override
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Existing Overrides */}
                        {specificRules.length === 0 && !showCreate ? (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-600 mb-1 font-medium">No overrides yet</p>
                                <p className="text-slate-400 text-sm mb-4">Create one to customize replies for specific posts</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    + Add your first override
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {specificRules.map(rule => {
                                    const expanded = expandedId === rule.id;
                                    const thumbs: string[] = [];
                                    if (rule.media_id) {
                                        const m = media.find(x => x.id === rule.media_id);
                                        if (m) thumbs.push(m.media_url);
                                    }
                                    rule.media_ids?.forEach(id => {
                                        const m = media.find(x => x.id === id);
                                        if (m && !thumbs.includes(m.media_url)) thumbs.push(m.media_url);
                                    });

                                    return (
                                        <div key={rule.id} className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                                            <div
                                                onClick={() => setExpandedId(expanded ? null : rule.id || null)}
                                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {thumbs.slice(0, 3).map((url, i) => (
                                                            <img key={i} src={url} className="w-10 h-10 rounded-lg border-2 border-white object-cover shadow-sm" alt="" />
                                                        ))}
                                                        {thumbs.length > 3 && (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-500">
                                                                +{thumbs.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-900">{rule.name}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                                                }`}>
                                                                {rule.is_active ? 'Active' : 'Off'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {rule.keywords?.length ? rule.keywords.map(k => `#${k}`).join(' ') : 'All comments'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {expanded && (
                                                <div className="px-4 py-4 border-t border-slate-200 bg-white space-y-4">
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-500 mb-1">Public Reply</label>
                                                            <textarea
                                                                value={rule.comment_reply}
                                                                onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, comment_reply: e.target.value } : r))}
                                                                className="w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="text-xs font-medium text-slate-500">Private DM</label>
                                                                <button
                                                                    onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, send_dm: !r.send_dm } : r))}
                                                                    className={`text-xs ${rule.send_dm ? 'text-indigo-600' : 'text-slate-400'}`}
                                                                >
                                                                    {rule.send_dm ? '✓ On' : 'Off'}
                                                                </button>
                                                            </div>
                                                            <textarea
                                                                value={rule.dm_reply}
                                                                onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, dm_reply: e.target.value } : r))}
                                                                disabled={!rule.send_dm}
                                                                className={`w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none resize-none ${rule.send_dm ? 'focus:border-indigo-500' : 'text-slate-400'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => {
                                                                    const updatedRule = { ...rule, is_active: !rule.is_active };
                                                                    setRules(rules.map(r => r.id === rule.id ? updatedRule : r));
                                                                    updateOverride(updatedRule);
                                                                }}
                                                                className="text-xs text-slate-500 hover:text-slate-700"
                                                            >
                                                                {rule.is_active ? 'Disable' : 'Enable'}
                                                            </button>
                                                            <button onClick={() => deleteRule(rule.id!)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => updateOverride(rule)}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
