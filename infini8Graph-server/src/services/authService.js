import axios from 'axios';
import supabase from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { generateToken } from '../utils/jwt.js';
import dotenv from 'dotenv';

dotenv.config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;
const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

/**
 * Generate the Meta OAuth login URL
 * @returns {string} - The OAuth URL
 */
export function getLoginUrl() {
    const scopes = [
        'instagram_basic',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'business_management',
        'ads_read',           // For ad account insights
        'read_insights'       // For page/app insights
    ].join(',');

    const params = new URLSearchParams({
        client_id: META_APP_ID,
        redirect_uri: META_REDIRECT_URI,
        scope: scopes,
        response_type: 'code',
        state: generateState()
    });

    return `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Generate a random state parameter for OAuth
 */
function generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Exchange authorization code for access token
 * @param {string} code - The authorization code
 * @returns {object} - Token data
 */
export async function exchangeCodeForToken(code) {
    try {
        // Exchange code for short-lived token
        const tokenResponse = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
            params: {
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                redirect_uri: META_REDIRECT_URI,
                code: code
            }
        });

        const shortLivedToken = tokenResponse.data.access_token;

        // Exchange for long-lived token
        const longLivedResponse = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                fb_exchange_token: shortLivedToken
            }
        });

        return {
            accessToken: longLivedResponse.data.access_token,
            expiresIn: longLivedResponse.data.expires_in || 5184000 // 60 days default
        };
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        throw new Error('Failed to exchange authorization code for token');
    }
}

/**
 * Get Facebook Pages and linked Instagram Business Account
 * @param {string} accessToken - The Facebook access token
 * @returns {object} - Instagram account data
 */
export async function getInstagramBusinessAccount(accessToken) {
    try {
        // Get user's Facebook Pages
        const pagesResponse = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,instagram_business_account'
            }
        });

        const pages = pagesResponse.data.data;

        if (!pages || pages.length === 0) {
            throw new Error('No Facebook Pages found. Please connect a Facebook Page to your account.');
        }

        // Find a page with Instagram Business Account
        const pageWithInstagram = pages.find(page => page.instagram_business_account);

        if (!pageWithInstagram) {
            throw new Error('No Instagram Business or Creator account found. Please link an Instagram Business account to your Facebook Page.');
        }

        const instagramAccountId = pageWithInstagram.instagram_business_account.id;

        // Get Instagram account details
        const instagramResponse = await axios.get(`${GRAPH_API_BASE}/${instagramAccountId}`, {
            params: {
                access_token: accessToken,
                fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website'
            }
        });

        return {
            instagramUserId: instagramResponse.data.id,
            username: instagramResponse.data.username,
            name: instagramResponse.data.name,
            profilePictureUrl: instagramResponse.data.profile_picture_url,
            followersCount: instagramResponse.data.followers_count,
            followsCount: instagramResponse.data.follows_count,
            mediaCount: instagramResponse.data.media_count,
            biography: instagramResponse.data.biography,
            website: instagramResponse.data.website
        };
    } catch (error) {
        console.error('Instagram account fetch error:', error.response?.data || error.message);
        throw new Error(error.message || 'Failed to fetch Instagram Business Account');
    }
}

/**
 * Create or update user in database and store encrypted token
 * @param {object} instagramData - Instagram account data
 * @param {string} accessToken - The access token to store
 * @param {number} expiresIn - Token expiration in seconds
 * @returns {object} - User data with JWT
 */
export async function createOrUpdateUser(instagramData, accessToken, expiresIn) {
    try {
        // Check if user exists
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('instagram_user_id', instagramData.instagramUserId)
            .single();

        let userId;

        if (existingUser) {
            // Update existing user
            userId = existingUser.id;
            await supabase
                .from('users')
                .update({
                    username: instagramData.username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
        } else {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    instagram_user_id: instagramData.instagramUserId,
                    username: instagramData.username
                })
                .select('id')
                .single();

            if (createError) throw createError;
            userId = newUser.id;
        }

        // Calculate token expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        // Encrypt and store/update token
        const encryptedToken = encrypt(accessToken);

        await supabase
            .from('auth_tokens')
            .upsert({
                user_id: userId,
                access_token: encryptedToken,
                expires_at: expiresAt.toISOString()
            }, {
                onConflict: 'user_id'
            });

        // Generate JWT for the user
        const jwtToken = generateToken({
            userId: userId,
            instagramUserId: instagramData.instagramUserId,
            username: instagramData.username
        });

        return {
            userId,
            jwt: jwtToken,
            user: instagramData
        };
    } catch (error) {
        console.error('User creation error:', error);
        throw new Error('Failed to create or update user');
    }
}

/**
 * Get decrypted access token for a user
 * @param {string} userId - The user's UUID
 * @returns {string|null} - The decrypted access token
 */
export async function getAccessToken(userId) {
    try {
        const { data, error } = await supabase
            .from('auth_tokens')
            .select('access_token, expires_at')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        // Check if token is expired
        if (new Date(data.expires_at) < new Date()) {
            console.warn('Access token has expired for user:', userId);
            return null;
        }

        return decrypt(data.access_token);
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}

/**
 * Log out user - remove their token
 * @param {string} userId - The user's UUID
 */
export async function logoutUser(userId) {
    try {
        await supabase
            .from('auth_tokens')
            .delete()
            .eq('user_id', userId);

        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

export default {
    getLoginUrl,
    exchangeCodeForToken,
    getInstagramBusinessAccount,
    createOrUpdateUser,
    getAccessToken,
    logoutUser
};
