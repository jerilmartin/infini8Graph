import crypto from 'crypto';
import autoReplyService from '../services/autoReplyService.js';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'infini8graph_webhook_verify_2024';

export async function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
}

export async function receiveWebhook(req, res) {
    // 1. Log immediately
    console.log('🔗 WEBHOOK TRIGGERED!');

    // 2. Return 200 immediately (Meta requirement)
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    console.log('📦 Data Received:', JSON.stringify(body, null, 2));

    try {
        if (body.object === 'instagram' || body.object === 'page') {
            const entries = body.entry || [];
            for (const entry of entries) {
                // Handle DMs
                if (entry.messaging) {
                    for (const msgEvent of entry.messaging) {
                        console.log(`💬 Processing DM from ${msgEvent.sender?.id}`);
                        await autoReplyService.processMessage(msgEvent);
                    }
                }
                // Handle Comments
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            console.log(`📝 Processing Comment from ${change.value?.from?.username}`);
                            await autoReplyService.processComment({ id: entry.id, changes: [change] });
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('❌ Error processing webhook logic:', err.message);
    }
}

export async function getWebhookStatus(req, res) {
    res.json({ success: true, status: 'active' });
}

export async function testAutoReply(req, res) {
    const { type, text } = req.body;
    const rules = type === 'comment' ? autoReplyService.commentRules : autoReplyService.messageRules;
    const rule = autoReplyService.findMatchingRule(text, rules);
    res.json({ success: true, matched: !!rule, reply: rule?.reply });
}

export default { verifyWebhook, receiveWebhook, getWebhookStatus, testAutoReply };
