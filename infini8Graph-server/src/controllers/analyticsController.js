import AnalyticsService from '../services/analyticsService.js';

async function getAnalyticsService(req) {
    const service = new AnalyticsService(req.user.userId, req.user.instagramUserId);
    await service.initialize();
    return service;
}

export async function getOverview(req, res) {
    try {
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getOverview();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Overview error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getGrowth(req, res) {
    try {
        const { period = '30d' } = req.query;
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getGrowth(period);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Growth error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getBestTime(req, res) {
    try {
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getBestTimeToPost();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Best time error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getHashtags(req, res) {
    try {
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getHashtagAnalysis();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Hashtags error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getReels(req, res) {
    try {
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getReelsAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Reels error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getPosts(req, res) {
    try {
        const { limit = 50 } = req.query;
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getPostsAnalytics(parseInt(limit));
        res.json({ success: true, data });
    } catch (error) {
        console.error('Posts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function exportData(req, res) {
    try {
        const { format = 'json', metrics = 'overview,growth,posts' } = req.query;
        const metricsArray = metrics.split(',');
        const analytics = await getAnalyticsService(req);
        const data = await analytics.exportData(format, metricsArray);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.csv`);
            let csv = '';
            for (const [section, content] of Object.entries(data)) {
                csv += `\n--- ${section.toUpperCase()} ---\n${content}\n`;
            }
            return res.send(csv);
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getContentIntelligence(req, res) {
    try {
        const analytics = await getAnalyticsService(req);
        const data = await analytics.getContentIntelligence();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Content intelligence error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default { getOverview, getGrowth, getBestTime, getHashtags, getReels, getPosts, exportData, getContentIntelligence };

