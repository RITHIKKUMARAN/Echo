import { Request, Response } from 'express';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export const createSession = async (req: Request, res: Response) => {
    try {
        const { courseId, title, scheduledTime } = req.body;
        const { uid, name } = (req as any).user;

        // 1. Generate Meet Link
        // Real Google Meet API requires authorized user OAuth token or Service Account with Domain-Wide Delegation.
        // For MVP/Demo: We generate a predictable "fake" but usable format or valid placeholder.
        // A valid format is often https://meet.google.com/abc-defg-hij
        const randomCode = () => Math.random().toString(36).substring(2, 5);
        const meetLink = `https://meet.google.com/${randomCode()}-${randomCode()}-${randomCode()}`;

        const sessionRef = db.collection('courses').doc(courseId).collection('sessions').doc();

        await sessionRef.set({
            sessionId: sessionRef.id,
            courseId,
            title,
            scheduledTime,
            meetLink,
            createdBy: { uid, name },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            attendees: []
        });

        return res.status(201).json({ sessionId: sessionRef.id, meetLink });

    } catch (error) {
        console.error('Create Session Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getSessions = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

        const sessionsSnap = await db.collection('courses')
            .doc(courseId as string)
            .collection('sessions')
            .orderBy('scheduledTime', 'asc')
            .get();

        const sessions = sessionsSnap.docs.map(doc => doc.data());
        return res.json(sessions);

    } catch (error) {
        console.error('Get Sessions Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
