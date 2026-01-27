import axios from 'axios';
import supabase from '../config/database.js';
import { decrypt } from '../utils/encryption.js';
import dotenv from 'dotenv';

dotenv.config();

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';
const INSTAGRAM_GRAPH_API = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;
const FACEBOOK_GRAPH_API = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Rate limiting: max 1 reply per user per 30 seconds
const REPLY_COOLDOWN_SECONDS = 30;

// 24-hour messaging window (in milliseconds)
const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

// In-memory cooldown tracker (for demo - use Redis in production)
const replyCooldowns = new Map();

/**
 * Auto-Reply Service
 * Handles automatic replies to Instagram comments and DMs
 */
class AutoReplyService {
    constructor() {
        // Define auto-reply rules (can be moved to database later)
        this.messageRules = [
            {
                keywords: ['hi', 'hello', 'hey', 'hola', 'namaste'],
                reply: 'Hey there! 👋 Thanks for reaching out. How can we help you today?',
                priority: 1
            },
            {
                keywords: ['price', 'cost', 'how much', 'rate', 'pricing'],
                reply: 'Thanks for your interest in our pricing! 💰 Please DM us with details about what you\'re looking for, and our team will get back to you shortly.',
                priority: 2
            },
            {
                keywords: ['help', 'support', 'issue', 'problem'],
                reply: 'We\'re here to help! 🙌 Please describe your issue and our support team will assist you as soon as possible.',
                priority: 2
            },
            {
                keywords: ['thanks', 'thank you', 'appreciate'],
                reply: 'You\'re welcome! 😊 Let us know if there\'s anything else we can help with.',
                priority: 3
            },
            {
                keywords: ['info', 'information', 'details', 'tell me more'],
                reply: 'Great question! 📝 For more information, please check our bio or send us a detailed message about what you\'d like to know.',
                priority: 2
            }
        ];

        this.commentRules = [
            {
                keywords: ['love', 'amazing', 'awesome', 'great', 'beautiful', '❤️', '🔥', '👏'],
                reply: 'Thank you so much! 🙏 We appreciate your support! ❤️',
                priority: 1
            },
            {
                keywords: ['price', 'cost', 'how much', 'rate'],
                reply: 'Thanks for your interest! 💰 Please DM us for pricing details.',
                priority: 2
            },
            {
                keywords: ['where', 'location', 'address', 'shop'],
                reply: 'Check our bio for location details! 📍 Feel free to DM us for more info.',
                priority: 2
            }
        ];
    }

    /**
     * Get access token for a user by Instagram account ID
     */
    async getAccessTokenByInstagramId(instagramUserId) {
        try {
            // First find the instagram account
            const { data: account, error: accountError } = await supabase
                .from('instagram_accounts')
                .select('id, user_id')
                .eq('instagram_user_id', instagramUserId)
                .single();

            if (accountError || !account) {
                console.error('❌ Instagram account not found:', instagramUserId);
                return null;
            }

            // Get the auth token
            const { data: tokenData, error: tokenError } = await supabase
                .from('auth_tokens')
                .select('access_token, expires_at')
                .eq('instagram_account_id', account.id)
                .single();

            if (tokenError || !tokenData) {
                console.error('❌ Auth token not found for account:', account.id);
                return null;
            }

            // Check if token is expired
            if (new Date(tokenData.expires_at) < new Date()) {
                console.warn('⚠️ Access token has expired');
                return null;
            }

            return {
                accessToken: decrypt(tokenData.access_token),
                instagramAccountId: account.id,
                userId: account.user_id
            };
        } catch (error) {
            console.error('❌ Error getting access token:', error);
            return null;
        }
    }

    /**
     * Check if we should reply (cooldown check)
     */
    shouldReply(senderId, type = 'message') {
        const key = `${type}:${senderId}`;
        const lastReply = replyCooldowns.get(key);
        const now = Date.now();

        if (lastReply && (now - lastReply) < (REPLY_COOLDOWN_SECONDS * 1000)) {
            console.log(`⏳ Cooldown active for ${senderId}, skipping reply`);
            return false;
        }

        return true;
    }

    /**
     * Mark that we replied (set cooldown)
     */
    markReplied(senderId, type = 'message') {
        const key = `${type}:${senderId}`;
        replyCooldowns.set(key, Date.now());
    }

    /**
     * Find matching rule for text
     */
    findMatchingRule(text, rules) {
        if (!text) return null;

        const lowerText = text.toLowerCase();

        // Sort by priority (lower = higher priority)
        const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

        for (const rule of sortedRules) {
            for (const keyword of rule.keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    return rule;
                }
            }
        }

        return null;
    }

    /**
     * Process incoming DM and send auto-reply
     */
    async processMessage(event) {
        try {
            const { sender, recipient, message, timestamp } = event;

            // Ignore messages without text
            if (!message?.text) {
                console.log('📭 Ignoring non-text message');
                return;
            }

            const senderId = sender?.id;
            const recipientId = recipient?.id; // This is the Instagram business account ID

            console.log(`📩 Processing message from ${senderId} to ${recipientId}`);
            console.log(`📝 Message text: "${message.text}"`);

            // Get access token for this Instagram account
            const tokenData = await this.getAccessTokenByInstagramId(recipientId);
            if (!tokenData) {
                console.error('❌ Cannot process message - no valid token');
                return;
            }

            // Ignore our own messages (echo protection)
            if (senderId === recipientId) {
                console.log('🔄 Ignoring own message (echo)');
                return;
            }

            // Check 24-hour window
            const messageTime = timestamp ? new Date(timestamp * 1000) : new Date();
            const windowEnd = new Date(messageTime.getTime() + MESSAGING_WINDOW_MS);
            if (new Date() > windowEnd) {
                console.log('⏰ Outside 24-hour messaging window');
                return;
            }

            // Check cooldown
            if (!this.shouldReply(senderId, 'message')) {
                return;
            }

            // Find matching rule
            const rule = this.findMatchingRule(message.text, this.messageRules);
            if (!rule) {
                console.log('📭 No matching rule for message');
                return;
            }

            // Send reply
            await this.sendMessageReply(recipientId, senderId, rule.reply, tokenData.accessToken);
            this.markReplied(senderId, 'message');

            // Log the reply
            await this.logReply({
                type: 'message',
                senderId,
                recipientId,
                originalText: message.text,
                replyText: rule.reply,
                instagramAccountId: tokenData.instagramAccountId
            });

        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    }

    /**
     * Send a DM reply
     */
    async sendMessageReply(instagramUserId, recipientIGSID, text, accessToken) {
        try {
            const response = await axios.post(
                `${INSTAGRAM_GRAPH_API}/${instagramUserId}/messages`,
                {
                    recipient: { id: recipientIGSID },
                    message: { text }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ DM sent successfully:`, response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error sending DM:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Process incoming comment and send auto-reply
     */
    async processComment(event) {
        try {
            const { id: instagramAccountId, changes } = event;

            for (const change of changes || []) {
                if (change.field !== 'comments') continue;

                const { value } = change;
                const { from, comment_id, text, media } = value;

                console.log(`📢 Processing comment from ${from?.username} on media ${media?.id}`);
                console.log(`📝 Comment text: "${text}"`);

                // Get access token for this Instagram account
                const tokenData = await this.getAccessTokenByInstagramId(instagramAccountId);
                if (!tokenData) {
                    console.error('❌ Cannot process comment - no valid token');
                    continue;
                }

                // Ignore our own comments
                if (from?.id === instagramAccountId) {
                    console.log('🔄 Ignoring own comment');
                    continue;
                }

                // Check cooldown
                if (!this.shouldReply(from?.id, 'comment')) {
                    continue;
                }

                // Find matching rule
                const rule = this.findMatchingRule(text, this.commentRules);
                if (!rule) {
                    console.log('📭 No matching rule for comment');
                    continue;
                }

                // Send reply
                await this.sendCommentReply(comment_id, rule.reply, tokenData.accessToken);
                this.markReplied(from?.id, 'comment');

                // Log the reply
                await this.logReply({
                    type: 'comment',
                    senderId: from?.id,
                    senderUsername: from?.username,
                    commentId: comment_id,
                    mediaId: media?.id,
                    originalText: text,
                    replyText: rule.reply,
                    instagramAccountId: tokenData.instagramAccountId
                });
            }
        } catch (error) {
            console.error('❌ Error processing comment:', error);
        }
    }

    /**
     * Send a comment reply
     */
    async sendCommentReply(commentId, text, accessToken) {
        try {
            const response = await axios.post(
                `${INSTAGRAM_GRAPH_API}/${commentId}/replies`,
                { message: text },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Comment reply sent successfully:`, response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error sending comment reply:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Log reply to database for analytics
     */
    async logReply(data) {
        try {
            // For demo, just log to console
            // In production, save to a webhook_logs or auto_replies table
            console.log('📊 Reply logged:', {
                type: data.type,
                senderId: data.senderId,
                originalText: data.originalText?.substring(0, 50),
                replyText: data.replyText?.substring(0, 50),
                timestamp: new Date().toISOString()
            });

            // Optionally save to database
            // await supabase.from('auto_reply_logs').insert(data);
        } catch (error) {
            console.error('⚠️ Failed to log reply:', error);
        }
    }

    /**
     * Get auto-reply statistics
     */
    async getStats(instagramAccountId) {
        // This would query the database for reply counts
        // For demo, return mock data
        return {
            totalRepliesSent: 0,
            messagingReplies: 0,
            commentReplies: 0,
            activeRules: this.messageRules.length + this.commentRules.length,
            lastActivity: null
        };
    }
}

// Export singleton instance
export default new AutoReplyService();
