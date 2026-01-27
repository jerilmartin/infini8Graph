import express from 'express';
import * as webhookController from '../controllers/webhookController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Webhook Routes for Instagram Auto-Reply
 * 
 * Webhook URL: https://your-domain.com/api/webhook
 * 
 * Setup in Meta App Dashboard:
 * 1. Go to your app → Webhooks
 * 2. Add Product → Webhooks → Setup
 * 3. For Instagram: Select "Instagram" object
 * 4. Callback URL: https://your-ngrok-url/api/webhook
 * 5. Verify Token: (use WEBHOOK_VERIFY_TOKEN from .env)
 * 6. Subscribe to: messages, messaging_postbacks, comments
 */

// =====================================================
// PUBLIC ROUTES (No auth required - Meta calls these)
// =====================================================

/**
 * GET /api/webhook
 * Meta webhook verification
 * Called when you first configure the webhook in Meta Dashboard
 */
router.get('/', webhookController.verifyWebhook);

/**
 * POST /api/webhook
 * Receive webhook events from Meta
 * Called every time an event occurs (message, comment, etc.)
 */
router.post('/', webhookController.receiveWebhook);

// =====================================================
// PROTECTED ROUTES (Auth required)
// =====================================================

/**
 * GET /api/webhook/status
 * Get webhook configuration and stats
 */
router.get('/status', authenticate, webhookController.getWebhookStatus);

/**
 * POST /api/webhook/test
 * Test auto-reply logic locally
 */
router.post('/test', optionalAuth, webhookController.testAutoReply);

export default router;
