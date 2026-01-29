import express from 'express';
import supabase from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all automation rules for the authenticated user
 */
router.get('/rules', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const activeAccountId = req.user.instagramAccountId;

        // If an active account is selected, only show rules for that account
        if (activeAccountId) {
            const { data: rules, error: rulesError } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('instagram_account_id', activeAccountId)
                .order('created_at', { ascending: false });

            if (rulesError) throw rulesError;
            return res.json({ success: true, rules: rules || [] });
        }

        // Get user's Instagram accounts (fallback)
        const { data: accounts, error: accountError } = await supabase
            .from('instagram_accounts')
            .select('id')
            .eq('user_id', userId);

        if (accountError) throw accountError;

        const accountIds = accounts.map(a => a.id);

        // Get rules for these accounts
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .in('instagram_account_id', accountIds)
            .order('created_at', { ascending: false });

        if (rulesError) throw rulesError;

        res.json({ success: true, rules: rules || [] });
    } catch (error) {
        console.error('Error fetching automation rules:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch rules' });
    }
});

/**
 * Create a new automation rule
 */
router.post('/rules', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const activeAccountId = req.user.instagramAccountId;
        const { name, keywords, comment_reply, dm_reply, send_dm, is_active, media_id, media_ids } = req.body;

        // Validate required fields (keywords optional for default rules)
        if (!name || !comment_reply) {
            return res.status(400).json({
                success: false,
                error: 'Name and comment_reply are required'
            });
        }

        if (!activeAccountId) {
            return res.status(400).json({
                success: false,
                error: 'No active Instagram account selected'
            });
        }

        // Create the rule
        const { data: rule, error: createError } = await supabase
            .from('automation_rules')
            .insert({
                instagram_account_id: activeAccountId,
                name,
                keywords,
                comment_reply,
                dm_reply: dm_reply || null,
                send_dm: send_dm || false,
                is_active: is_active !== false,
                media_id: media_id || null,
                media_ids: media_ids || null // New array column
            })
            .select()
            .single();

        if (createError) throw createError;

        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error creating automation rule:', error);
        res.status(500).json({ success: false, error: 'Failed to create rule' });
    }
});

/**
 * Update an automation rule
 */
router.patch('/rules/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ruleId = req.params.id;
        const updates = req.body;

        // Verify ownership
        const { data: accounts } = await supabase
            .from('instagram_accounts')
            .select('id')
            .eq('user_id', userId);

        const accountIds = accounts?.map(a => a.id) || [];

        // Check if rule belongs to user
        const { data: existingRule, error: fetchError } = await supabase
            .from('automation_rules')
            .select('instagram_account_id')
            .eq('id', ruleId)
            .single();

        if (fetchError || !existingRule || !accountIds.includes(existingRule.instagram_account_id)) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }

        // Update the rule
        const { data: rule, error: updateError } = await supabase
            .from('automation_rules')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', ruleId)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error updating automation rule:', error);
        res.status(500).json({ success: false, error: 'Failed to update rule' });
    }
});

/**
 * Delete an automation rule
 */
router.delete('/rules/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ruleId = req.params.id;

        // Verify ownership
        const { data: accounts } = await supabase
            .from('instagram_accounts')
            .select('id')
            .eq('user_id', userId);

        const accountIds = accounts?.map(a => a.id) || [];

        // Check if rule belongs to user
        const { data: existingRule, error: fetchError } = await supabase
            .from('automation_rules')
            .select('instagram_account_id')
            .eq('id', ruleId)
            .single();

        if (fetchError || !existingRule || !accountIds.includes(existingRule.instagram_account_id)) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }

        // Delete the rule
        const { error: deleteError } = await supabase
            .from('automation_rules')
            .delete()
            .eq('id', ruleId);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Rule deleted' });
    } catch (error) {
        console.error('Error deleting automation rule:', error);
        res.status(500).json({ success: false, error: 'Failed to delete rule' });
    }
});

export default router;
