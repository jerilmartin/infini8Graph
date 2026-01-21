import * as authService from '../services/authService.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

/**
 * Get ad accounts overview with summary metrics
 */
export async function getAdAccounts(req, res) {
    try {
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const response = await axios.get(`${GRAPH_API_BASE}/me/adaccounts`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,account_id,account_status,currency,timezone_name,business_name,amount_spent',
                limit: 50
            }
        });

        const adAccounts = response.data.data || [];
        console.log(`📊 Found ${adAccounts.length} ad accounts`);

        // Get insights for each account
        const accountsWithInsights = await Promise.all(
            adAccounts.map(async (account) => {
                try {
                    const insightsRes = await axios.get(`${GRAPH_API_BASE}/${account.id}/insights`, {
                        params: {
                            access_token: accessToken,
                            fields: 'spend,impressions,reach,clicks,cpc,cpm,ctr,frequency',
                            date_preset: 'last_90d'
                        }
                    });
                    return { ...account, insights: insightsRes.data.data?.[0] || null };
                } catch {
                    return { ...account, insights: null };
                }
            })
        );

        // Sort by spend (highest first)
        const sorted = accountsWithInsights.sort((a, b) => {
            const aSpend = parseFloat(a.insights?.spend || 0);
            const bSpend = parseFloat(b.insights?.spend || 0);
            return bSpend - aSpend;
        });

        res.json({
            success: true,
            data: { adAccounts: sorted, total: adAccounts.length }
        });
    } catch (error) {
        console.error('Ad accounts error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || 'Failed to fetch ad accounts' });
    }
}

/**
 * Get detailed insights for a specific ad account
 */
export async function getAdInsights(req, res) {
    try {
        const { adAccountId } = req.params;
        const { datePreset = 'last_90d' } = req.query;
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        // First, get ads with their relevance diagnostics (these are only available at ad level)
        let adRelevanceData = [];
        try {
            const adsResponse = await axios.get(`${GRAPH_API_BASE}/${accountId}/ads`, {
                params: {
                    access_token: accessToken,
                    fields: 'name,status,insights.date_preset(' + datePreset + '){quality_ranking,engagement_rate_ranking,conversion_rate_ranking,impressions,spend}',
                    limit: 50
                }
            });
            adRelevanceData = adsResponse.data.data || [];
        } catch (err) {
            console.log('Could not fetch ad-level relevance data:', err.response?.data?.error?.message || err.message);
        }

        // Get comprehensive insights with all new metrics
        const [summaryRes, dailyRes, demographicsRes, placementsRes, deviceRes, positionRes, countryRes, regionRes] = await Promise.allSettled([
            // Summary metrics with ROAS
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values,cost_per_action_type,purchase_roas,website_purchase_roas,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,outbound_clicks,unique_outbound_clicks,inline_link_clicks,cost_per_inline_link_click,social_spend',
                    date_preset: datePreset
                }
            }),
            // Daily breakdown
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach,ctr',
                    date_preset: datePreset,
                    time_increment: 1
                }
            }),
            // Age and gender breakdown
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach,ctr',
                    date_preset: datePreset,
                    breakdowns: 'age,gender'
                }
            }),
            // Publisher platform breakdown (Instagram vs Facebook)
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach',
                    date_preset: datePreset,
                    breakdowns: 'publisher_platform'
                }
            }),
            // Device platform breakdown (Mobile vs Desktop)
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach',
                    date_preset: datePreset,
                    breakdowns: 'device_platform'
                }
            }),
            // Platform position breakdown (Feed, Stories, Reels, etc.)
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach',
                    date_preset: datePreset,
                    breakdowns: 'platform_position'
                }
            }),
            // Country breakdown
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach,ctr',
                    date_preset: datePreset,
                    breakdowns: 'country'
                }
            }),
            // Region breakdown
            axios.get(`${GRAPH_API_BASE}/${accountId}/insights`, {
                params: {
                    access_token: accessToken,
                    fields: 'spend,impressions,clicks,reach',
                    date_preset: datePreset,
                    breakdowns: 'region'
                }
            })
        ]);

        // Process results
        const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data.data?.[0] : null;
        const daily = dailyRes.status === 'fulfilled' ? dailyRes.value.data.data : [];
        const demographics = demographicsRes.status === 'fulfilled' ? demographicsRes.value.data.data : [];
        const placements = placementsRes.status === 'fulfilled' ? placementsRes.value.data.data : [];
        const devices = deviceRes.status === 'fulfilled' ? deviceRes.value.data.data : [];
        const positions = positionRes.status === 'fulfilled' ? positionRes.value.data.data : [];
        const countries = countryRes.status === 'fulfilled' ? countryRes.value.data.data : [];
        const regions = regionRes.status === 'fulfilled' ? regionRes.value.data.data : [];

        // Extract video views from actions
        let videoViews = { views_3s: 0, views_25: 0, views_50: 0, views_75: 0, views_100: 0 };
        if (summary?.video_p25_watched_actions) {
            videoViews.views_25 = parseInt(summary.video_p25_watched_actions[0]?.value || 0);
        }
        if (summary?.video_p50_watched_actions) {
            videoViews.views_50 = parseInt(summary.video_p50_watched_actions[0]?.value || 0);
        }
        if (summary?.video_p75_watched_actions) {
            videoViews.views_75 = parseInt(summary.video_p75_watched_actions[0]?.value || 0);
        }
        if (summary?.video_p100_watched_actions) {
            videoViews.views_100 = parseInt(summary.video_p100_watched_actions[0]?.value || 0);
        }

        // Extract conversions from actions
        let conversions = [];
        if (summary?.actions) {
            conversions = summary.actions.filter(a =>
                ['purchase', 'lead', 'complete_registration', 'add_to_cart', 'initiate_checkout', 'link_click', 'post_engagement', 'page_engagement'].includes(a.action_type)
            ).map(a => ({
                type: a.action_type,
                value: parseInt(a.value)
            }));
        }

        // Extract action values (monetary)
        let actionValues = [];
        if (summary?.action_values) {
            actionValues = summary.action_values.map(a => ({
                type: a.action_type,
                value: parseFloat(a.value)
            }));
        }

        // Extract cost per action type
        let costPerAction = [];
        if (summary?.cost_per_action_type) {
            costPerAction = summary.cost_per_action_type.map(a => ({
                type: a.action_type,
                value: parseFloat(a.value)
            }));
        }

        // Ad Relevance Diagnostics - aggregate from individual ads
        // Rankings are only available at ad level, not account level
        let qualityRankings = [];
        let engagementRankings = [];
        let conversionRankings = [];

        for (const ad of adRelevanceData) {
            const insights = ad.insights?.data?.[0];
            if (insights) {
                if (insights.quality_ranking && insights.quality_ranking !== 'UNKNOWN') {
                    qualityRankings.push(insights.quality_ranking);
                }
                if (insights.engagement_rate_ranking && insights.engagement_rate_ranking !== 'UNKNOWN') {
                    engagementRankings.push(insights.engagement_rate_ranking);
                }
                if (insights.conversion_rate_ranking && insights.conversion_rate_ranking !== 'UNKNOWN') {
                    conversionRankings.push(insights.conversion_rate_ranking);
                }
            }
        }

        // Helper function to get most common ranking
        const getMostCommon = (arr) => {
            if (arr.length === 0) return 'UNKNOWN';
            const counts = arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
            return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        };

        const relevanceDiagnostics = {
            qualityRanking: getMostCommon(qualityRankings),
            engagementRateRanking: getMostCommon(engagementRankings),
            conversionRateRanking: getMostCommon(conversionRankings),
            adsAnalyzed: adRelevanceData.length,
            adsWithData: qualityRankings.length
        };

        // ROAS metrics
        const roas = {
            purchaseRoas: summary?.purchase_roas?.[0]?.value || 0,
            websitePurchaseRoas: summary?.website_purchase_roas?.[0]?.value || 0
        };

        // Advanced click metrics
        const clickMetrics = {
            outboundClicks: summary?.outbound_clicks?.[0]?.value || 0,
            uniqueOutboundClicks: summary?.unique_outbound_clicks?.[0]?.value || 0,
            inlineLinkClicks: summary?.inline_link_clicks || 0,
            costPerInlineLinkClick: summary?.cost_per_inline_link_click || 0,
            socialSpend: summary?.social_spend || 0
        };

        res.json({
            success: true,
            data: {
                summary: {
                    spend: summary?.spend || '0',
                    impressions: summary?.impressions || '0',
                    reach: summary?.reach || '0',
                    clicks: summary?.clicks || '0',
                    cpc: summary?.cpc || '0',
                    cpm: summary?.cpm || '0',
                    ctr: summary?.ctr || '0',
                    frequency: summary?.frequency || '0'
                },
                relevanceDiagnostics,
                roas,
                clickMetrics,
                actionValues,
                costPerAction,
                videoViews,
                conversions,
                daily,
                demographics,
                placements,
                devices,
                positions,
                countries,
                regions
            }
        });
    } catch (error) {
        console.error('Ad insights error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || 'Failed to fetch ad insights' });
    }
}

/**
 * Get campaigns for an ad account
 */
export async function getCampaigns(req, res) {
    try {
        const { adAccountId } = req.params;
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        const response = await axios.get(`${GRAPH_API_BASE}/${accountId}/campaigns`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,insights{spend,impressions,reach,clicks,cpc,cpm,ctr}',
                limit: 50
            }
        });

        const campaigns = response.data.data || [];

        res.json({
            success: true,
            data: { campaigns }
        });
    } catch (error) {
        console.error('Campaigns error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || 'Failed to fetch campaigns' });
    }
}

/**
 * Get ad sets for an ad account
 */
export async function getAdSets(req, res) {
    try {
        const { adAccountId } = req.params;
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        const response = await axios.get(`${GRAPH_API_BASE}/${accountId}/adsets`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,insights{spend,impressions,reach,clicks,cpc,cpm,ctr}',
                limit: 50
            }
        });

        res.json({
            success: true,
            data: { adSets: response.data.data || [] }
        });
    } catch (error) {
        console.error('Ad sets error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || 'Failed to fetch ad sets' });
    }
}

/**
 * Get individual ads for an ad account
 */
export async function getAds(req, res) {
    try {
        const { adAccountId } = req.params;
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

        const response = await axios.get(`${GRAPH_API_BASE}/${accountId}/ads`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,status,creative,adset_id,campaign_id,insights{spend,impressions,reach,clicks,cpc,cpm,ctr}',
                limit: 50
            }
        });

        res.json({
            success: true,
            data: { ads: response.data.data || [] }
        });
    } catch (error) {
        console.error('Ads error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || 'Failed to fetch ads' });
    }
}

/**
 * Test permissions
 */
export async function testAdsPermissions(req, res) {
    try {
        const accessToken = await authService.getAccessToken(req.user.userId);

        if (!accessToken) {
            return res.status(401).json({ success: false, error: 'Access token not found' });
        }

        const results = { ads_read: { success: false, message: '' }, read_insights: { success: false, message: '' } };

        try {
            const adResponse = await axios.get(`${GRAPH_API_BASE}/me/adaccounts`, {
                params: { access_token: accessToken, fields: 'id,name' }
            });
            results.ads_read = { success: true, message: `Found ${adResponse.data.data?.length || 0} ad accounts`, data: adResponse.data.data };
        } catch (err) {
            results.ads_read = { success: false, message: err.response?.data?.error?.message || 'Failed' };
        }

        try {
            const pagesRes = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
                params: { access_token: accessToken, fields: 'id,name,access_token' }
            });
            const pages = pagesRes.data.data || [];
            if (pages.length > 0) {
                results.read_insights = { success: true, message: `Found ${pages.length} pages` };
            }
        } catch (err) {
            results.read_insights = { success: false, message: err.response?.data?.error?.message || 'Failed' };
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Permission test failed' });
    }
}

export async function getPageInsights(req, res) {
    res.json({ success: true, message: 'Not implemented' });
}
