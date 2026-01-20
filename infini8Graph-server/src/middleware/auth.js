import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware
 * Validates JWT token from HttpOnly cookie or Authorization header
 */
export function authenticate(req, res, next) {
    try {
        // Try to get token from HttpOnly cookie first
        let token = req.cookies?.auth_token;

        // Fallback to Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            instagramUserId: decoded.instagramUserId,
            username: decoded.username
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't block if missing
 */
export function optionalAuth(req, res, next) {
    try {
        let token = req.cookies?.auth_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = {
                    userId: decoded.userId,
                    instagramUserId: decoded.instagramUserId,
                    username: decoded.username
                };
            }
        }

        next();
    } catch (error) {
        // Continue without auth
        next();
    }
}

export default { authenticate, optionalAuth };
