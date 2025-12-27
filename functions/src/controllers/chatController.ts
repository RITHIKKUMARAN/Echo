import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { vertexService } from '../services/vertexService';
import * as admin from 'firebase-admin';

export const createChat = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const { courseId, title } = req.body;

        const chatRef = db.collection('users').doc(uid).collection('chats').doc();
        const chatData = {
            chatId: chatRef.id,
            courseId: courseId || null,
            title: title || 'New Chat',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: []
        };

        await chatRef.set(chatData);
        // Return with ID so frontend can redirect
        return res.status(201).json({ ...chatData, chatId: chatRef.id });
    } catch (error: any) {
        console.error('Create Chat Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const { chatId } = req.params;
        const { message, courseId } = req.body;

        const chatRef = db.collection('users').doc(uid).collection('chats').doc(chatId);
        const chatSnap = await chatRef.get();

        if (!chatSnap.exists) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // 1. Add User Message
        const userMsg = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        // 2. RAG Retrieval
        let contextText = '';
        if (courseId) {
            // Find relevant chunks from Firestore using basic exact match or retrieve all (for MVP)
            // Ideally we use Vector Search here. For MVP, let's grab the first few chunks or last uploaded.
            // Simplified: Grab first 5 chunks of the course.
            // TODO: Implement Vector Search using Vertex AI Vector Search
            try {
                const chunksSnap = await db.collection('courses').doc(courseId).collection('chunks').limit(5).get();
                if (!chunksSnap.empty) {
                    contextText = chunksSnap.docs.map(doc => doc.data().text).join('\n\n');
                }
            } catch (err) {
                console.warn("RAG Retrieval warning:", err);
            }
        }

        // 3. Generate AI Response
        const prompt = `
        You are an AI tutor acting as a "Neural Notebook".
        Answer based on the following context if available.
        
        ${contextText ? `CONTEXT FROM COURSE MATERIALS:\n${contextText}\n` : ''}
        
        User asking: "${message}"
        
        Answer helpfully, concisely, and accurately.
        `;

        const aiResponse = await vertexService.generateContent(prompt);

        const aiMsg = {
            role: 'model',
            content: aiResponse,
            timestamp: new Date().toISOString()
        };

        // 4. Update Chat History
        await chatRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(userMsg, aiMsg),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({ response: aiResponse, messages: [userMsg, aiMsg] });

    } catch (error: any) {
        console.error('Send Message Error:', error);
        // Fallback if AI fails
        return res.json({
            response: "I'm having trouble connecting to my brain (Vertex AI). Please try again later.",
            error: error.message
        });
    }
};

export const getUserChats = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const chatsSnap = await db.collection('users').doc(uid).collection('chats')
            .orderBy('updatedAt', 'desc')
            .get();

        const chats = chatsSnap.docs.map(doc => doc.data());
        return res.json(chats);
    } catch (error) {
        console.error('Get Chats Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getChatDetails = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const { chatId } = req.params;
        const chatDoc = await db.collection('users').doc(uid).collection('chats').doc(chatId).get();

        if (!chatDoc.exists) return res.status(404).json({ error: 'Chat not found' });
        return res.json(chatDoc.data());
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
