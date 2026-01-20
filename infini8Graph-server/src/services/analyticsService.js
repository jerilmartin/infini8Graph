import supabase from '../config/database.js';
import InstagramService from './instagramService.js';
import { getAccessToken } from './authService.js';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = {
    overview: parseInt(process.env.CACHE_TTL_OVERVIEW) || 300,
    growth: parseInt(process.env.CACHE_TTL_GROWTH) || 600,
    posts: parseInt(process.env.CACHE_TTL_POSTS) || 300,
    reels: parseInt(process.env.CACHE_TTL_REELS) || 300,
    best_time: 600,
    hashtags: 600
};

/**
 * Analytics Service
 * Handles KPI calculations, caching, and data aggregation
 */
class AnalyticsService {
    constructor(userId, instagramUserId) {
        this.userId = userId;
        this.instagramUserId = instagramUserId;
        this.instagram = null;
    }

    /**
     * Initialize Instagram service with access token
     */
    async initialize() {
        const accessToken = await getAccessToken(this.userId);
        if (!accessToken) {
            throw new Error('No valid access token found. Please re-authenticate.');
        }
        this.instagram = new InstagramService(accessToken, this.instagramUserId);
        return this;
    }

    /**
     * Check cache for existing data
     */
    async checkCache(metricType, dateRange = 'current') {
        try {
            const { data, error } = await supabase
                .from('analytics_cache')
                .select('aggregated_data, last_fetched_at')
                .eq('user_id', this.userId)
                .eq('metric_type', metricType)
                .eq('date_range', dateRange)
                .single();

            if (error || !data) return null;

            // Check if cache is still valid
            const lastFetched = new Date(data.last_fetched_at);
            const now = new Date();
            const ageSeconds = (now - lastFetched) / 1000;
            const ttl = CACHE_TTL[metricType] || 300;

            if (ageSeconds > ttl) {
                return null; // Cache expired
            }

            return data.aggregated_data;
        } catch (error) {
            console.error('Cache check error:', error);
            return null;
        }
    }

    /**
     * Update cache with new data
     */
    async updateCache(metricType, dateRange, data) {
        try {
            await supabase
                .from('analytics_cache')
                .upsert({
                    user_id: this.userId,
                    metric_type: metricType,
                    date_range: dateRange,
                    aggregated_data: data,
                    last_fetched_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,metric_type,date_range'
                });
        } catch (error) {
            console.error('Cache update error:', error);
        }
    }

    /**
     * Get overview analytics (dashboard main metrics)
     */
    async getOverview() {
        // Check cache first
        const cached = await this.checkCache('overview');
        if (cached) return cached;

        // Fetch fresh data
        const profile = await this.instagram.getProfile();
        const media = await this.instagram.getAllMediaWithInsights(30);

        // Calculate engagement rate
        const totalEngagement = media.reduce((sum, post) => sum + post.engagement, 0);
        const avgEngagement = media.length > 0 ? totalEngagement / media.length : 0;
        const engagementRate = profile.followers_count > 0
            ? (avgEngagement / profile.followers_count * 100).toFixed(2)
            : 0;

        // Calculate metrics
        const totalImpressions = media.reduce((sum, post) => sum + post.impressions, 0);
        const totalReach = media.reduce((sum, post) => sum + post.reach, 0);
        const totalLikes = media.reduce((sum, post) => sum + post.likeCount, 0);
        const totalComments = media.reduce((sum, post) => sum + post.commentsCount, 0);
        const totalSaved = media.reduce((sum, post) => sum + post.saved, 0);

        // Get recent posts performance
        const recentPosts = media.slice(0, 10).map(post => ({
            id: post.id,
            type: post.mediaType,
            likes: post.likeCount,
            comments: post.commentsCount,
            engagement: post.engagement,
            timestamp: post.timestamp,
            thumbnailUrl: post.thumbnailUrl || post.mediaUrl
        }));

        const overview = {
            profile: {
                username: profile.username,
                name: profile.name,
                profilePictureUrl: profile.profile_picture_url,
                biography: profile.biography,
                website: profile.website
            },
            metrics: {
                followers: profile.followers_count,
                following: profile.follows_count,
                posts: profile.media_count,
                engagementRate: parseFloat(engagementRate),
                avgLikes: Math.round(totalLikes / Math.max(media.length, 1)),
                avgComments: Math.round(totalComments / Math.max(media.length, 1)),
                totalImpressions,
                totalReach,
                totalSaved
            },
            recentPosts,
            lastUpdated: new Date().toISOString()
        };

        // Cache the result
        await this.updateCache('overview', 'current', overview);

        return overview;
    }

    /**
     * Get growth analytics
     */
    async getGrowth(period = '30d') {
        const cached = await this.checkCache('growth', period);
        if (cached) return cached;

        const profile = await this.instagram.getProfile();
        const media = await this.instagram.getAllMediaWithInsights(100);

        // Group posts by date for growth analysis
        const postsByDate = {};
        const engagementByDate = {};

        media.forEach(post => {
            const date = new Date(post.timestamp).toISOString().split('T')[0];
            if (!postsByDate[date]) {
                postsByDate[date] = 0;
                engagementByDate[date] = { likes: 0, comments: 0, total: 0 };
            }
            postsByDate[date]++;
            engagementByDate[date].likes += post.likeCount;
            engagementByDate[date].comments += post.commentsCount;
            engagementByDate[date].total += post.engagement;
        });

        // Calculate growth trends
        const dates = Object.keys(postsByDate).sort();
        const growthData = dates.map(date => ({
            date,
            posts: postsByDate[date],
            engagement: engagementByDate[date].total,
            likes: engagementByDate[date].likes,
            comments: engagementByDate[date].comments
        }));

        // Calculate week-over-week changes
        const thisWeekPosts = media.filter(p => {
            const postDate = new Date(p.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return postDate >= weekAgo;
        });

        const lastWeekPosts = media.filter(p => {
            const postDate = new Date(p.timestamp);
            const weekAgo = new Date();
            const twoWeeksAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            return postDate >= twoWeeksAgo && postDate < weekAgo;
        });

        const thisWeekEngagement = thisWeekPosts.reduce((sum, p) => sum + p.engagement, 0);
        const lastWeekEngagement = lastWeekPosts.reduce((sum, p) => sum + p.engagement, 0);
        const engagementChange = lastWeekEngagement > 0
            ? ((thisWeekEngagement - lastWeekEngagement) / lastWeekEngagement * 100).toFixed(1)
            : 0;

        const growth = {
            currentFollowers: profile.followers_count,
            currentFollowing: profile.follows_count,
            totalPosts: profile.media_count,
            growthData,
            weeklyStats: {
                postsThisWeek: thisWeekPosts.length,
                engagementThisWeek: thisWeekEngagement,
                engagementChange: parseFloat(engagementChange),
                avgEngagementPerPost: thisWeekPosts.length > 0
                    ? Math.round(thisWeekEngagement / thisWeekPosts.length)
                    : 0
            },
            lastUpdated: new Date().toISOString()
        };

        await this.updateCache('growth', period, growth);
        return growth;
    }

    /**
     * Get best time to post analysis
     */
    async getBestTimeToPost() {
        const cached = await this.checkCache('best_time');
        if (cached) return cached;

        const media = await this.instagram.getAllMediaWithInsights(100);

        // Analyze by hour and day of week
        const hourlyEngagement = {};
        const dailyEngagement = {};
        const hourlyCount = {};
        const dailyCount = {};

        for (let i = 0; i < 24; i++) {
            hourlyEngagement[i] = 0;
            hourlyCount[i] = 0;
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(day => {
            dailyEngagement[day] = 0;
            dailyCount[day] = 0;
        });

        media.forEach(post => {
            const date = new Date(post.timestamp);
            const hour = date.getHours();
            const day = days[date.getDay()];

            hourlyEngagement[hour] += post.engagement;
            hourlyCount[hour]++;
            dailyEngagement[day] += post.engagement;
            dailyCount[day]++;
        });

        // Calculate averages
        const hourlyAvg = Object.keys(hourlyEngagement).map(hour => ({
            hour: parseInt(hour),
            avgEngagement: hourlyCount[hour] > 0
                ? Math.round(hourlyEngagement[hour] / hourlyCount[hour])
                : 0,
            postCount: hourlyCount[hour]
        }));

        const dailyAvg = days.map(day => ({
            day,
            avgEngagement: dailyCount[day] > 0
                ? Math.round(dailyEngagement[day] / dailyCount[day])
                : 0,
            postCount: dailyCount[day]
        }));

        // Find best times
        const sortedHours = [...hourlyAvg].sort((a, b) => b.avgEngagement - a.avgEngagement);
        const sortedDays = [...dailyAvg].sort((a, b) => b.avgEngagement - a.avgEngagement);

        const bestTime = {
            hourlyAnalysis: hourlyAvg,
            dailyAnalysis: dailyAvg,
            recommendations: {
                bestHours: sortedHours.slice(0, 3).map(h => h.hour),
                bestDays: sortedDays.slice(0, 3).map(d => d.day),
                optimalPostingTimes: sortedHours.slice(0, 3).map(h => ({
                    hour: h.hour,
                    engagement: h.avgEngagement,
                    formatted: `${h.hour.toString().padStart(2, '0')}:00`
                }))
            },
            postsAnalyzed: media.length,
            lastUpdated: new Date().toISOString()
        };

        await this.updateCache('best_time', 'current', bestTime);
        return bestTime;
    }

    /**
     * Get hashtag performance analysis
     */
    async getHashtagAnalysis() {
        const cached = await this.checkCache('hashtags');
        if (cached) return cached;

        const media = await this.instagram.getAllMediaWithInsights(100);

        // Extract hashtags from captions
        const hashtagStats = {};

        media.forEach(post => {
            const hashtags = (post.caption || '').match(/#\w+/g) || [];
            hashtags.forEach(tag => {
                const normalizedTag = tag.toLowerCase();
                if (!hashtagStats[normalizedTag]) {
                    hashtagStats[normalizedTag] = {
                        tag: normalizedTag,
                        usageCount: 0,
                        totalEngagement: 0,
                        totalLikes: 0,
                        totalComments: 0,
                        posts: []
                    };
                }
                hashtagStats[normalizedTag].usageCount++;
                hashtagStats[normalizedTag].totalEngagement += post.engagement;
                hashtagStats[normalizedTag].totalLikes += post.likeCount;
                hashtagStats[normalizedTag].totalComments += post.commentsCount;
                hashtagStats[normalizedTag].posts.push(post.id);
            });
        });

        // Calculate averages and sort
        const hashtagList = Object.values(hashtagStats)
            .map(h => ({
                ...h,
                avgEngagement: Math.round(h.totalEngagement / h.usageCount),
                avgLikes: Math.round(h.totalLikes / h.usageCount),
                avgComments: Math.round(h.totalComments / h.usageCount)
            }))
            .sort((a, b) => b.avgEngagement - a.avgEngagement);

        const hashtags = {
            topPerforming: hashtagList.slice(0, 20),
            mostUsed: [...hashtagList].sort((a, b) => b.usageCount - a.usageCount).slice(0, 20),
            totalHashtagsUsed: hashtagList.length,
            avgHashtagsPerPost: media.length > 0
                ? (hashtagList.reduce((sum, h) => sum + h.usageCount, 0) / media.length).toFixed(1)
                : 0,
            postsAnalyzed: media.length,
            lastUpdated: new Date().toISOString()
        };

        await this.updateCache('hashtags', 'current', hashtags);
        return hashtags;
    }

    /**
     * Get reels-specific analytics
     */
    async getReelsAnalytics() {
        const cached = await this.checkCache('reels');
        if (cached) return cached;

        const media = await this.instagram.getAllMediaWithInsights(100);

        // Filter for reels only
        const reels = media.filter(m => m.mediaType === 'REEL' || m.mediaType === 'VIDEO');
        const nonReels = media.filter(m => m.mediaType !== 'REEL' && m.mediaType !== 'VIDEO');

        // Calculate reel-specific metrics
        const reelStats = {
            totalReels: reels.length,
            totalEngagement: reels.reduce((sum, r) => sum + r.engagement, 0),
            totalLikes: reels.reduce((sum, r) => sum + r.likeCount, 0),
            totalComments: reels.reduce((sum, r) => sum + r.commentsCount, 0),
            totalImpressions: reels.reduce((sum, r) => sum + r.impressions, 0),
            totalReach: reels.reduce((sum, r) => sum + r.reach, 0)
        };

        const nonReelStats = {
            totalPosts: nonReels.length,
            avgEngagement: nonReels.length > 0
                ? Math.round(nonReels.reduce((sum, p) => sum + p.engagement, 0) / nonReels.length)
                : 0
        };

        const analytics = {
            reels: reels.map(r => ({
                id: r.id,
                thumbnail: r.thumbnailUrl || r.mediaUrl,
                likes: r.likeCount,
                comments: r.commentsCount,
                engagement: r.engagement,
                impressions: r.impressions,
                reach: r.reach,
                timestamp: r.timestamp
            })),
            summary: {
                ...reelStats,
                avgEngagement: reels.length > 0
                    ? Math.round(reelStats.totalEngagement / reels.length)
                    : 0,
                avgLikes: reels.length > 0
                    ? Math.round(reelStats.totalLikes / reels.length)
                    : 0,
                avgComments: reels.length > 0
                    ? Math.round(reelStats.totalComments / reels.length)
                    : 0
            },
            comparison: {
                reelAvgEngagement: reels.length > 0
                    ? Math.round(reelStats.totalEngagement / reels.length)
                    : 0,
                postAvgEngagement: nonReelStats.avgEngagement,
                reelMultiplier: nonReelStats.avgEngagement > 0
                    ? ((reelStats.totalEngagement / Math.max(reels.length, 1)) / nonReelStats.avgEngagement).toFixed(2)
                    : 0
            },
            lastUpdated: new Date().toISOString()
        };

        await this.updateCache('reels', 'current', analytics);
        return analytics;
    }

    /**
     * Get detailed post analytics
     */
    async getPostsAnalytics(limit = 50) {
        const cached = await this.checkCache('posts');
        if (cached) return cached;

        const media = await this.instagram.getAllMediaWithInsights(limit);

        // Sort by different metrics
        const byEngagement = [...media].sort((a, b) => b.engagement - a.engagement);
        const byLikes = [...media].sort((a, b) => b.likeCount - a.likeCount);
        const byComments = [...media].sort((a, b) => b.commentsCount - a.commentsCount);
        const byReach = [...media].sort((a, b) => b.reach - a.reach);

        const posts = {
            all: media.map(p => ({
                id: p.id,
                type: p.mediaType,
                caption: p.caption?.substring(0, 100) + (p.caption?.length > 100 ? '...' : ''),
                thumbnail: p.thumbnailUrl || p.mediaUrl,
                permalink: p.permalink,
                likes: p.likeCount,
                comments: p.commentsCount,
                engagement: p.engagement,
                impressions: p.impressions,
                reach: p.reach,
                saved: p.saved,
                timestamp: p.timestamp
            })),
            topByEngagement: byEngagement.slice(0, 10).map(p => p.id),
            topByLikes: byLikes.slice(0, 10).map(p => p.id),
            topByComments: byComments.slice(0, 10).map(p => p.id),
            topByReach: byReach.slice(0, 10).map(p => p.id),
            summary: {
                totalPosts: media.length,
                totalEngagement: media.reduce((sum, p) => sum + p.engagement, 0),
                avgEngagement: media.length > 0
                    ? Math.round(media.reduce((sum, p) => sum + p.engagement, 0) / media.length)
                    : 0,
                totalReach: media.reduce((sum, p) => sum + p.reach, 0),
                avgReach: media.length > 0
                    ? Math.round(media.reduce((sum, p) => sum + p.reach, 0) / media.length)
                    : 0
            },
            lastUpdated: new Date().toISOString()
        };

        await this.updateCache('posts', 'current', posts);
        return posts;
    }

    /**
     * Export analytics data in various formats
     */
    async exportData(format = 'json', metrics = ['overview', 'growth', 'posts']) {
        const data = {};

        for (const metric of metrics) {
            switch (metric) {
                case 'overview':
                    data.overview = await this.getOverview();
                    break;
                case 'growth':
                    data.growth = await this.getGrowth();
                    break;
                case 'posts':
                    data.posts = await this.getPostsAnalytics();
                    break;
                case 'reels':
                    data.reels = await this.getReelsAnalytics();
                    break;
                case 'bestTime':
                    data.bestTime = await this.getBestTimeToPost();
                    break;
                case 'hashtags':
                    data.hashtags = await this.getHashtagAnalysis();
                    break;
            }
        }

        if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return data;
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        const csvSections = {};

        if (data.overview) {
            const metrics = data.overview.metrics;
            csvSections.overview = 'Metric,Value\n' +
                Object.entries(metrics).map(([k, v]) => `${k},${v}`).join('\n');
        }

        if (data.posts?.all) {
            const headers = 'ID,Type,Likes,Comments,Engagement,Reach,Timestamp';
            const rows = data.posts.all.map(p =>
                `${p.id},${p.type},${p.likes},${p.comments},${p.engagement},${p.reach},${p.timestamp}`
            );
            csvSections.posts = headers + '\n' + rows.join('\n');
        }

        return csvSections;
    }
}

export default AnalyticsService;
