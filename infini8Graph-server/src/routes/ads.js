import express from 'express';
import * as adsController from '../controllers/adsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Test permissions
router.get('/test-permissions', adsController.testAdsPermissions);

// Ad accounts
router.get('/accounts', adsController.getAdAccounts);

// Detailed insights for an account
router.get('/accounts/:adAccountId/insights', adsController.getAdInsights);

// Campaigns
router.get('/accounts/:adAccountId/campaigns', adsController.getCampaigns);

// Ad Sets
router.get('/accounts/:adAccountId/adsets', adsController.getAdSets);

// Individual Ads
router.get('/accounts/:adAccountId/ads', adsController.getAds);

// Conversion Funnel Analytics
router.get('/accounts/:adAccountId/funnel', adsController.getConversionFunnel);

// Campaign Intelligence (deep analytics)
router.get('/accounts/:adAccountId/intelligence', adsController.getCampaignIntelligence);

// Page insights
router.get('/page-insights', adsController.getPageInsights);

export default router;
