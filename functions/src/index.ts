import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import notebookRoutes from './routes/notebookRoutes';
import doubtRoutes from './routes/doubtRoutes';
import sessionRoutes from './routes/sessionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import chatRoutes from './routes/chatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import professorRoutes from './routes/professorRoutes';
import sheetsRoutes from './routes/sheetsRoutes';

const app = express();

// Middleware
app.use(cors({ origin: true }));

// 1. Upload Route - Must be registered BEFORE body parsers to handle raw stream
app.use('/upload', uploadRoutes);

// 2. Body Parsers - Apply to all remaining routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/professor', professorRoutes);
app.use('/sheets', sheetsRoutes);
app.use('/users', userRoutes);
app.use('/notebook', notebookRoutes);
app.use('/chats', chatRoutes); // Persistent chat history
app.use('/chat', chatRoutes); // Frontend alias
app.use('/doubts', doubtRoutes);
app.use('/sessions', sessionRoutes);
app.use('/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Campus AI Platform API is running');
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('🔥 Global Error Handler Caught:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

// Export the API
export const api = functions.https.onRequest(app);

// Export Triggers
export * from './triggers/storageTriggers';
export * from './triggers/scheduledTriggers';


