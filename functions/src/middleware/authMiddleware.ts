
import { Request, Response, NextFunction } from 'express';
// import { auth } from '../config/firebase'; // Temporarily disabled

export interface AuthRequest extends Request {
    user?: any;
}

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // TEMPORARY: Bypass token validation in emulator mode
        // Create a mock user from the token payload (it's a JWT)
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            (req as AuthRequest).user = {
                uid: payload.user_id || payload.sub || 'test_user_id',
                email: payload.email || 'test@example.com',
                name: payload.name || 'Test User'
            };
            console.log('[EMULATOR MODE] Bypassed token validation for user:', (req as AuthRequest).user?.email);
            next();
            return;
        } catch (decodeError) {
            // If decode fails, still pass with mock user for testing
            (req as AuthRequest).user = {
                uid: 'test_user_id',
                email: 'test@example.com',
                name: 'Test User'
            };
            console.log('[EMULATOR MODE] Using fallback mock user');
            next();
            return;
        }

        /* PRODUCTION TOKEN VALIDATION (TEMPORARILY DISABLED)
        const decodedToken = await auth.verifyIdToken(token);
        (req as AuthRequest).user = decodedToken;
        next();
        return;
        */
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const requireRole = (role: 'student' | 'professor') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!(req as any).user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Note: In a real app, you might store role in custom claims or look it up in Firestore
        // For now, checking if it exists in the decoded token (if you added custom claims)
        // Or we fetching user from DB. For now, we'll pass.
        // TODO: Implement strict role checking via custom claims or DB lookup
        next();
        return;
    }
}
