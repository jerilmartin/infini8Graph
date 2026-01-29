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
        send_dm: false,
        is_active: false,
        media_id: null,
        media_ids: []
    });

    // UI States
    const [showKeywords, setShowKeywords] = useState(false);
    const [showCreateOverride, setShowCreateOverride] = useState(false);
    const [expandedOverride, setExpandedOverride] = useState<string | null>(null);

    // Override creation
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
                if (def) {
                    setDefaultRule(def);
                    if (def.keywords?.length > 0) setShowKeywords(true);
                }
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
                notify('success', 'Saved successfully!');
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
                setShowCreateOverride(false);
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

    const deleteRule = async (id: string) => {
        if (!confirm('Delete this override?')) return;
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

    const addKw = (input: string, setInput: (v: string) => void, rule: AutomationRule, setRule: (r: AutomationRule) => void) => {
        if (!input.trim()) return;
        const newKws = input.split(/[,\s]+/).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        const uniqueKws = [...new Set([...rule.keywords, ...newKws])];
        setRule({ ...rule, keywords: uniqueKws });
        setInput('');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#64748b', fontSize: 14 }}>Loading automation...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 1000,
                    padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500,
                    background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 16,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                        }}>
                            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Auto-Reply</h1>
                            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>Automatically respond to Instagram comments & DMs</p>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                    {/* LEFT COLUMN */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* CARD: Default Auto-Reply */}
                        <div style={{
                            background: 'white', borderRadius: 20, overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            {/* Card Header */}
                            <div style={{
                                padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: defaultRule.is_active ? '#10b981' : '#d1d5db',
                                        boxShadow: defaultRule.is_active ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                                    }} />
                                    <div>
                                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Default Auto-Reply</h2>
                                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Applies to all your posts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDefaultRule({ ...defaultRule, is_active: !defaultRule.is_active })}
                                    style={{
                                        width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                                        background: defaultRule.is_active ? '#6366f1' : '#e2e8f0',
                                        position: 'relative', transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%', background: 'white',
                                        position: 'absolute', top: 3,
                                        left: defaultRule.is_active ? 27 : 3,
                                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }} />
                                </button>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: 24 }}>
                                {/* Trigger Keywords - Collapsible */}
                                <div style={{ marginBottom: 20 }}>
                                    <button
                                        onClick={() => setShowKeywords(!showKeywords)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
                                            border: 'none', cursor: 'pointer', padding: 0, fontSize: 13,
                                            color: '#64748b', fontWeight: 500
                                        }}
                                    >
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                            style={{ transform: showKeywords ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                        Trigger keywords
                                        {defaultRule.keywords.length > 0 && (
                                            <span style={{
                                                background: '#ede9fe', color: '#6366f1', fontSize: 11,
                                                padding: '2px 8px', borderRadius: 10, fontWeight: 600
                                            }}>{defaultRule.keywords.length}</span>
                                        )}
                                    </button>

                                    {showKeywords && (
                                        <div style={{ marginTop: 16, paddingLeft: 24 }}>
                                            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
                                                Only reply when comments contain these words. Leave empty to reply to all.
                                            </p>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <input
                                                    type="text"
                                                    value={defaultKwInput}
                                                    onChange={e => setDefaultKwInput(e.target.value)}
                                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addKw(defaultKwInput, setDefaultKwInput, defaultRule, setDefaultRule))}
                                                    placeholder="price, info, link..."
                                                    style={{
                                                        flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14,
                                                        border: '1.5px solid #e2e8f0', outline: 'none', background: '#fafafa',
                                                        transition: 'border 0.2s, background 0.2s'
                                                    }}
                                                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }}
                                                />
                                                <button
                                                    onClick={() => addKw(defaultKwInput, setDefaultKwInput, defaultRule, setDefaultRule)}
                                                    style={{
                                                        padding: '12px 18px', borderRadius: 12, border: 'none',
                                                        background: '#f1f5f9', color: '#475569', fontSize: 13,
                                                        fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                                                    onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                                                >Add</button>
                                            </div>
                                            {defaultRule.keywords.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                                    {defaultRule.keywords.map(k => (
                                                        <span key={k} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                                            padding: '6px 12px', background: '#ede9fe', color: '#6366f1',
                                                            fontSize: 13, borderRadius: 20, fontWeight: 500
                                                        }}>
                                                            {k}
                                                            <button onClick={() => setDefaultRule({ ...defaultRule, keywords: defaultRule.keywords.filter(x => x !== k) })}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#6366f1' }}>
                                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Comment Reply */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                        Comment reply
                                    </label>
                                    <textarea
                                        value={defaultRule.comment_reply}
                                        onChange={e => setDefaultRule({ ...defaultRule, comment_reply: e.target.value })}
                                        placeholder="Thanks for your comment! Check your DMs 📩"
                                        style={{
                                            width: '100%', minHeight: 100, padding: '14px 16px', borderRadius: 14,
                                            border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical',
                                            outline: 'none', background: '#fafafa', lineHeight: 1.5,
                                            transition: 'border 0.2s, background 0.2s', boxSizing: 'border-box'
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }}
                                    />
                                </div>

                                {/* DM Toggle */}
                                <div style={{ marginBottom: 24 }}>
                                    <button
                                        onClick={() => setDefaultRule({ ...defaultRule, send_dm: !defaultRule.send_dm })}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10, background: 'none',
                                            border: 'none', cursor: 'pointer', padding: 0
                                        }}
                                    >
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 6,
                                            border: defaultRule.send_dm ? 'none' : '2px solid #d1d5db',
                                            background: defaultRule.send_dm ? '#6366f1' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}>
                                            {defaultRule.send_dm && (
                                                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Also send a private DM</span>
                                    </button>

                                    {defaultRule.send_dm && (
                                        <div style={{ marginTop: 16, paddingLeft: 32 }}>
                                            <textarea
                                                value={defaultRule.dm_reply}
                                                onChange={e => setDefaultRule({ ...defaultRule, dm_reply: e.target.value })}
                                                placeholder="Hey! Thanks for reaching out. Here's more info..."
                                                style={{
                                                    width: '100%', minHeight: 90, padding: '14px 16px', borderRadius: 14,
                                                    border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical',
                                                    outline: 'none', background: '#fafafa', lineHeight: 1.5,
                                                    transition: 'border 0.2s, background 0.2s', boxSizing: 'border-box'
                                                }}
                                                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={saveDefault}
                                    disabled={saving}
                                    style={{
                                        width: '100%', padding: '14px 24px', borderRadius: 14, border: 'none',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                                        color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                                        opacity: saving ? 0.7 : 1, transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)'; }}
                                >
                                    {saving ? (
                                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save default reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* CARD: Post Overrides */}
                        <div style={{
                            background: 'white', borderRadius: 20, overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            {/* Card Header */}
                            <div style={{
                                padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Post Overrides</h2>
                                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Custom replies for specific posts</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateOverride(!showCreateOverride)}
                                    style={{
                                        padding: '10px 16px', borderRadius: 10, border: 'none',
                                        background: showCreateOverride ? '#f1f5f9' : '#ede9fe',
                                        color: showCreateOverride ? '#475569' : '#6366f1',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                                    }}
                                >
                                    {showCreateOverride ? (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add override
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Create Override Form */}
                            {showCreateOverride && (
                                <div style={{ padding: 24, background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Rule name</label>
                                        <input
                                            type="text" value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                            placeholder="e.g. Summer Sale Post"
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
                                                border: '1.5px solid #e2e8f0', outline: 'none', background: 'white',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                            Select posts {(newRule.media_ids?.length || 0) > 0 && <span style={{ color: '#6366f1', fontWeight: 500 }}>({newRule.media_ids?.length} selected)</span>}
                                        </label>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8,
                                            maxHeight: 160, overflowY: 'auto', padding: 12, background: 'white',
                                            borderRadius: 12, border: '1.5px solid #e2e8f0'
                                        }}>
                                            {media.length === 0 ? (
                                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 24, fontSize: 13 }}>No posts available</p>
                                            ) : (
                                                media.map(m => {
                                                    const selected = newRule.media_ids?.includes(m.id);
                                                    return (
                                                        <div key={m.id} onClick={() => togglePost(m.id)}
                                                            style={{
                                                                aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                                                position: 'relative', border: selected ? '2px solid #6366f1' : '2px solid transparent',
                                                                transition: 'border 0.2s'
                                                            }}>
                                                            <img src={m.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                            {selected && (
                                                                <div style={{
                                                                    position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.3)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    <div style={{
                                                                        width: 20, height: 20, borderRadius: '50%', background: '#6366f1',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }}>
                                                                        <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Comment reply</label>
                                            <textarea value={newRule.comment_reply} onChange={e => setNewRule({ ...newRule, comment_reply: e.target.value })}
                                                placeholder="Your reply..." style={{
                                                    width: '100%', minHeight: 80, padding: '12px 14px', borderRadius: 12,
                                                    border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical', outline: 'none',
                                                    boxSizing: 'border-box'
                                                }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Private DM</label>
                                            <textarea value={newRule.dm_reply} onChange={e => setNewRule({ ...newRule, dm_reply: e.target.value })}
                                                placeholder="DM message..." style={{
                                                    width: '100%', minHeight: 80, padding: '12px 14px', borderRadius: 12,
                                                    border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical', outline: 'none',
                                                    boxSizing: 'border-box'
                                                }} />
                                        </div>
                                    </div>

                                    <button onClick={createOverride} disabled={saving}
                                        style={{
                                            width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
                                            background: '#6366f1', color: 'white', fontSize: 14, fontWeight: 600,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}>
                                        {saving && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                                        Create override
                                    </button>
                                </div>
                            )}

                            {/* Overrides List */}
                            <div>
                                {specificRules.length === 0 ? (
                                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                                        <div style={{
                                            width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16,
                                            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No overrides yet</p>
                                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '6px 0 0' }}>Create custom replies for specific posts</p>
                                    </div>
                                ) : (
                                    specificRules.map(rule => {
                                        const expanded = expandedOverride === rule.id;
                                        const thumbs = rule.media_ids?.map(id => media.find(x => x.id === id)?.media_url).filter(Boolean).slice(0, 3) || [];
                                        return (
                                            <div key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div onClick={() => setExpandedOverride(expanded ? null : rule.id || null)}
                                                    style={{
                                                        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16,
                                                        cursor: 'pointer', transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#fafbfc'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                    <div style={{ display: 'flex', marginLeft: -4 }}>
                                                        {thumbs.map((url, i) => (
                                                            <img key={i} src={url} style={{
                                                                width: 40, height: 40, borderRadius: 8, objectFit: 'cover',
                                                                border: '2px solid white', marginLeft: i > 0 ? -12 : 0
                                                            }} alt="" />
                                                        ))}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{rule.name}</span>
                                                            <span style={{
                                                                fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500,
                                                                background: rule.is_active ? '#d1fae5' : '#f1f5f9',
                                                                color: rule.is_active ? '#059669' : '#64748b'
                                                            }}>{rule.is_active ? 'Active' : 'Off'}</span>
                                                        </div>
                                                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                                                            {rule.keywords?.length ? `Keywords: ${rule.keywords.join(', ')}` : 'All comments'}
                                                        </p>
                                                    </div>
                                                    <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                                                        style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                                {expanded && (
                                                    <div style={{ padding: '16px 24px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                                            <div>
                                                                <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Comment Reply</span>
                                                                <p style={{ fontSize: 13, color: '#374151', margin: '6px 0 0' }}>{rule.comment_reply}</p>
                                                            </div>
                                                            {rule.send_dm && (
                                                                <div>
                                                                    <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Private DM</span>
                                                                    <p style={{ fontSize: 13, color: '#374151', margin: '6px 0 0' }}>{rule.dm_reply}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button onClick={() => deleteRule(rule.id!)}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                                                fontSize: 13, fontWeight: 500, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6
                                                            }}>
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Live Preview */}
                    <div style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
                        <div style={{
                            background: 'white', borderRadius: 20, overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            {/* Preview Header */}
                            <div style={{
                                padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                                background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="16" height="16" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>Live Preview</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#7c3aed', margin: '4px 0 0', opacity: 0.8 }}>How your auto-reply will appear</p>
                            </div>

                            {/* Preview Content */}
                            <div style={{ padding: 20 }}>
                                {/* Incoming Comment */}
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Incoming Comment</span>
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)'
                                        }} />
                                        <div style={{
                                            flex: 1, padding: '10px 14px', background: '#f1f5f9',
                                            borderRadius: '16px 16px 16px 4px'
                                        }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', margin: 0 }}>@user_example</p>
                                            <p style={{ fontSize: 13, color: '#1e293b', margin: '4px 0 0' }}>
                                                {defaultRule.keywords.length > 0 ? (
                                                    <>Hey, what's the <span style={{ background: '#fef08a', padding: '1px 4px', borderRadius: 4 }}>{defaultRule.keywords[0]}</span>?</>
                                                ) : 'Hey, interested in this!'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                    <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                </div>

                                {/* Your Reply */}
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Your Reply</span>
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                        }} />
                                        <div style={{
                                            flex: 1, padding: '10px 14px', background: '#ede9fe',
                                            borderRadius: '16px 16px 16px 4px', border: '1px solid #ddd6fe'
                                        }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', margin: 0 }}>@your_account</p>
                                            <p style={{ fontSize: 13, color: '#1e293b', margin: '4px 0 0' }}>
                                                {defaultRule.comment_reply || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Enter a reply above...</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* DM Preview */}
                                {defaultRule.send_dm && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
                                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>+ Private DM</span>
                                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                        </div>

                                        <div style={{
                                            padding: 16, borderRadius: 14,
                                            background: 'linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%)',
                                            border: '1px solid #ede9fe'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <svg width="14" height="14" fill="none" stroke="#9333ea" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#9333ea' }}>Direct Message</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                                                {defaultRule.dm_reply || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Enter a DM message...</span>}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Status */}
                                <div style={{
                                    marginTop: 20, padding: '10px 14px', borderRadius: 10,
                                    background: defaultRule.is_active ? '#d1fae5' : '#f1f5f9',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: defaultRule.is_active ? '#10b981' : '#94a3b8',
                                        boxShadow: defaultRule.is_active ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none'
                                    }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: defaultRule.is_active ? '#059669' : '#64748b' }}>
                                        {defaultRule.is_active ? 'Auto-reply is active' : 'Auto-reply is off'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
