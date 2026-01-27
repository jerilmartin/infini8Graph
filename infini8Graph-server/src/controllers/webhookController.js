import crypto from 'crypto';
import autoReplyService from '../services/autoReplyService.js';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'infini8graph_webhook_verify_2024';
const META_APP_SECRET = process.env.META_APP_SECRET;

/**
 * Verify webhook signature from Meta
 */
function verifySignature(signature, payload) {
    if (!signature || !META_APP_SECRET) {
        console.warn('⚠️ Missing signature or app secret');
        return false;
    }

    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', META_APP_SECRET)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Webhook Verification (GET)
 */
export async function verifyWebhook(req, res) {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('🔐 Webhook verification request received');

        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully');
            return res.status(200).send(challenge);
        }

        console.error('❌ Webhook verification failed - token mismatch');
        return res.status(403).json({ error: 'Verification failed' });
    } catch (error) {
        console.error('❌ Webhook verification error:', error);
        return res.status(500).json({ error: 'Verification error' });
    }
}

/**
 * Webhook Event Receiver (POST)
 */
export async function receiveWebhook(req, res) {
    try {
        // Log immediately when any data hits this endpoint
        console.log('🔗 Incoming Request to Webhook');

        res.status(200).send('EVENT_RECEIVED');

        const body = req.body;
        console.log('📬 Webhook event received:', JSON.stringify(body, null, 2));

        if (body.object === 'instagram') {
            setImmediate(() => processInstagramEvents(body.entry));
        } else if (body.object === 'page') {
            setImmediate(() => processPageEvents(body.entry));
        } else {
            console.log(`📭 Unhandled webhook object type: ${body.object}`);
        }

    } catch (error) {
        console.error('❌ Webhook receive error:', error);
    }
}

/**
 * Process Instagram webhook events
 */
async function processInstagramEvents(entries) {
    for (const entry of entries || []) {
        console.log(`📍 Processing entry for Instagram account: ${entry.id}`);

        if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
                console.log('📩 Messaging event details:', JSON.stringify(messagingEvent, null, 2));

                if (messagingEvent.message) {
                    console.log(`💬 Message text: "${messagingEvent.message.text}" from sender: ${messagingEvent.sender?.id}`);

                    await autoReplyService.processMessage({
                        sender: messagingEvent.sender,
                        recipient: messagingEvent.recipient,
                        message: messagingEvent.message,
                        timestamp: messagingEvent.timestamp
                    });
                }
            }
        }

        if (entry.changes) {
            for (const change of entry.changes) {
                console.log(`📝 Change event field: ${change.field}`);
                if (change.field === 'comments') {
                    await autoReplyService.processComment({
                        id: entry.id,
                        changes: [change]
                    });
                }
            }
        }
    }
}

/**
 * Process Page webhook events
 */
async function processPageEvents(entries) {
    for (const entry of entries || []) {
        if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
                if (messagingEvent.sender?.id && messagingEvent.message) {
                    await autoReplyService.processMessage({
                        sender: messagingEvent.sender,
                        recipient: messagingEvent.recipient,
                        message: messagingEvent.message,
                        timestamp: messagingEvent.timestamp
                    });
                }
            }
        }
    }
}

export async function getWebhookStatus(req, res) {
    try {
        const stats = await autoReplyService.getStats(req.user?.instagramAccountId);
        res.json({
            success: true,
            data: {
                status: 'active',
                subscriptions: ['messages', 'comments'],
                stats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function testAutoReply(req, res) {
    try {
        const { type, text } = req.body;
        const rules = type === 'comment' ? autoReplyService.commentRules : autoReplyService.messageRules;
        const rule = autoReplyService.findMatchingRule(text, rules);
        res.json({ success: true, data: { matchedRule: rule, wouldReply: !!rule } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    verifyWebhook,
    receiveWebhook,
    getWebhookStatus,
    testAutoReply
};
