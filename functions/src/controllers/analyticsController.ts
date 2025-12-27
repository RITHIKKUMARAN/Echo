import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getProfessorAnalytics = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

        // 1. Aggregate Stats (Mock logic for speed, real DB aggregation is costly without Counters)

        // Count Doubts
        const doubtsSnap = await db.collection('doubts').where('courseId', '==', courseId).get();
        const totalDoubts = doubtsSnap.size;

        const resolvedDoubts = doubtsSnap.docs.filter(d => d.data().resolved).length;

        // Topic Analysis (Mock)
        const commonTopics = [
            { topic: "Backpropagation", count: 15 },
            { topic: "Gradient Descent", count: 8 },
            { topic: "Activation Functions", count: 5 }
        ];

        return res.json({
            totalDoubts,
            resolvedDoubts,
            resolutionRate: totalDoubts > 0 ? (resolvedDoubts / totalDoubts) * 100 : 0,
            commonTopics
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
