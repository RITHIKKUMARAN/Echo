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
// Increase payload limits for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/professor', professorRoutes);
app.use('/sheets', sheetsRoutes);
app.use('/users', userRoutes);
app.use('/notebook', notebookRoutes);
app.use('/chats', chatRoutes); // Persistent chat history
app.use('/doubts', doubtRoutes);
app.use('/sessions', sessionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Campus AI Platform API is running');
});

// Export the API
export const api = functions.https.onRequest(app);

// Export Triggers
export * from './triggers/storageTriggers';
export * from './triggers/scheduledTriggers';


