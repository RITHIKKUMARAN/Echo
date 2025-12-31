// Doubt Escalation Service
// Automatic escalation: OPEN → SENIOR_VISIBLE (30min) → PROFESSOR (2hr)

import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Escalation Timings
const TIME_TO_SENIOR = 30 * 60 * 1000; // 30 minutes
const TIME_TO_PROFESSOR = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Check and escalate doubts based on time thresholds
 * Should be called periodically (e.g., every minute)
 */
export async function checkAndEscalateDoubts(): Promise<number> {
    try {
        const now = new Date();
        let escalationCount = 0;

        // Get all unresolved doubts
        const q = query(
            collection(db, 'doubts'),
            where('resolved', '==', false)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const doubt = docSnap.data();
            const doubtId = docSnap.id;

            // Skip if no lastEscalatedAt (shouldn't happen but safety check)
            if (!doubt.lastEscalatedAt) continue;

            const escalatedTime = doubt.lastEscalatedAt.toDate
                ? doubt.lastEscalatedAt.toDate()
                : new Date(doubt.lastEscalatedAt);

            const diffMs = now.getTime() - escalatedTime.getTime();

            // Rule 1: OPEN → SENIOR_VISIBLE (after 30 minutes)
            if (doubt.status === 'OPEN' && diffMs >= TIME_TO_SENIOR) {
                await updateDoc(doc(db, 'doubts', doubtId), {
                    status: 'SENIOR_VISIBLE',
                    lastEscalatedAt: serverTimestamp()
                });
                console.log(`✅ Escalated doubt ${doubtId} to SENIOR_VISIBLE`);
                escalationCount++;
            }
            // Rule 2: SENIOR_VISIBLE → PROFESSOR (after 2 hours from OPEN)
            else if (doubt.status === 'SENIOR_VISIBLE' && diffMs >= TIME_TO_PROFESSOR) {
                await updateDoc(doc(db, 'doubts', doubtId), {
                    status: 'PROFESSOR',
                    lastEscalatedAt: serverTimestamp()
                });
                console.log(`✅ Escalated doubt ${doubtId} to PROFESSOR`);
                escalationCount++;
            }
        }

        if (escalationCount > 0) {
            console.log(`📊 Escalation check complete: ${escalationCount} doubts escalated`);
        }

        return escalationCount;
    } catch (error) {
        console.error('❌ Error in escalation check:', error);
        return 0;
    }
}

/**
 * Get doubts escalated to professors
 */
export async function getProfessorDoubts(courseId?: string): Promise<any[]> {
    try {
        let q;

        if (courseId) {
            q = query(
                collection(db, 'doubts'),
                where('status', '==', 'PROFESSOR'),
                where('courseId', '==', courseId)
            );
        } else {
            q = query(
                collection(db, 'doubts'),
                where('status', '==', 'PROFESSOR')
            );
        }

        const snapshot = await getDocs(q);
        const doubts: any[] = [];

        snapshot.forEach((doc) => {
            doubts.push({
                doubtId: doc.id,
                ...doc.data()
            });
        });

        // Sort by escalation time (oldest first - needs attention)
        doubts.sort((a, b) => {
            const timeA = a.lastEscalatedAt?.toDate ? a.lastEscalatedAt.toDate().getTime() : 0;
            const timeB = b.lastEscalatedAt?.toDate ? b.lastEscalatedAt.toDate().getTime() : 0;
            return timeA - timeB;
        });

        return doubts;
    } catch (error) {
        console.error('Error fetching professor doubts:', error);
        return [];
    }
}

/**
 * Get confusion insights (topics with most doubts)
 */
export async function getConfusionInsights(courseId: string): Promise<any[]> {
    try {
        const q = query(
            collection(db, 'doubts'),
            where('courseId', '==', courseId)
        );

        const snapshot = await getDocs(q);
        const topicCounts: { [topic: string]: number } = {};

        snapshot.forEach((doc) => {
            const doubt = doc.data();
            // Use extracted topics if available, otherwise use first few words
            const topic = doubt.extractedTopic || doubt.content.substring(0, 50);
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });

        // Convert to array and sort
        const insights = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count);

        return insights;
    } catch (error) {
        console.error('Error getting insights:', error);
        return [];
    }
}

export const escalationService = {
    checkAndEscalateDoubts,
    getProfessorDoubts,
    getConfusionInsights
};

export default escalationService;
