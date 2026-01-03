import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// Middleware to validate professor authorization
const validateProfessor = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Professor ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Extract professor UID from header
    req.professorUid = authHeader.split('Professor ')[1];
    next();
};

// Get all users/peers for professor
router.get('/peers', validateProfessor, async (req, res) => {
    try {
        const db = admin.firestore();
        const usersSnapshot = await db.collection('users').get();

        const users = usersSnapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));

        res.json({ users });
    } catch (error) {
        console.error('Error fetching peers:', error);
        res.status(500).json({ error: 'Failed to fetch peers' });
    }
});

// Get professor's connections
router.get('/connections', validateProfessor, async (req, res) => {
    try {
        const db = admin.firestore();
        const connectionsSnapshot = await db.collection('connections').get();

        const connections = connectionsSnapshot.docs.map(doc => ({
            connectionId: doc.id,
            ...doc.data()
        }));

        res.json({ connections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// Get escalated doubts for a course
router.get('/doubts/:courseId', validateProfessor, async (req, res) => {
    try {
        const { courseId } = req.params;
        const db = admin.firestore();

        const doubtsSnapshot = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .where('status', 'in', ['PROFESSOR', 'SENIOR_VISIBLE', 'OPEN'])
            .get();

        const doubts = doubtsSnapshot.docs.map(doc => ({
            doubtId: doc.id,
            ...doc.data()
        }));

        res.json({ doubts });
    } catch (error) {
        console.error('Error fetching doubts:', error);
        res.status(500).json({ error: 'Failed to fetch doubts' });
    }
});

// Get confusion insights for a course
router.get('/insights/:courseId', validateProfessor, async (req, res) => {
    try {
        const { courseId } = req.params;
        const db = admin.firestore();

        // Get all doubts for the course and analyze topics
        const doubtsSnapshot = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .get();

        // Count topics
        const topicCounts: { [key: string]: number } = {};
        doubtsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((tag: string) => {
                    topicCounts[tag] = (topicCounts[tag] || 0) + 1;
                });
            }
        });

        // Convert to array and sort
        const insights = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        res.json({ insights });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

// Get sessions for a course
router.get('/sessions/:courseId', validateProfessor, async (req, res) => {
    try {
        const { courseId } = req.params;
        const db = admin.firestore();

        const sessionsSnapshot = await db.collection('teachingSessions')
            .where('courseId', '==', courseId)
            .get();

        const sessions = sessionsSnapshot.docs.map(doc => ({
            sessionId: doc.id,
            ...doc.data()
        }));

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

export default router;
