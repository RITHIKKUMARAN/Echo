import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { vertexService } from '../services/vertexService';
import * as admin from 'firebase-admin';

export const createDoubt = async (req: Request, res: Response) => {
    try {
        const { courseId, content } = req.body;
        const { uid, name } = (req as any).user;

        // 1. Create Doubt
        const doubtRef = db.collection('doubts').doc();
        const doubtData = {
            doubtId: doubtRef.id,
            courseId,
            content,
            askedBy: { uid, name },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'AI_PROCESSING', // Intermediate state
            resolved: false,
            replies: []
        };
        await doubtRef.set(doubtData);

        // 2. Immediate AI Attempt
        // We do this inline for the "wow" factor of speed, but could be backgrounded
        const prompt = `
        A student asked: "${content}"
        
        Provide a helpful, precise answer. If it's too complex, suggest asking a professor.
        `;
        const aiAnswer = await vertexService.generateContent(prompt);

        // 3. Add AI Reply
        const aiReply = {
            replyId: `ai_${Date.now()}`,
            doubtId: doubtRef.id,
            content: aiAnswer,
            repliedBy: { uid: 'ai-bot', name: 'Campus AI' },
            createdAt: new Date().toISOString(), // Use simple string for array storage
            isAi: true
        };

        await doubtRef.update({
            replies: admin.firestore.FieldValue.arrayUnion(aiReply),
            status: 'AI_ANSWERED'
        });

        return res.status(201).json({ ...doubtData, aiReply });

    } catch (error) {
        console.error('Create Doubt Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDoubts = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        let query = db.collection('doubts').orderBy('createdAt', 'desc');

        if (courseId) {
            query = query.where('courseId', '==', courseId);
        }

        const snapshot = await query.get();
        const doubts = snapshot.docs.map(doc => doc.data());

        return res.json(doubts);

    } catch (error) {
        console.error('Get Doubts Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
