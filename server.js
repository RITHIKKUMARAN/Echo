require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // For DOCX files

// Initialize Firebase Admin (for Firestore access)
if (!admin.apps.length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './functions/serviceAccountKey.json';
    try {
        if (require('fs').existsSync(serviceAccountPath)) {
            admin.initializeApp({
                credential: admin.credential.cert(require(path.resolve(serviceAccountPath)))
            });
            console.log('✅ Firebase Admin initialized with service account');
        } else {
            admin.initializeApp();
            console.log('⚠️ Firebase Admin initialized without explicit credentials');
        }
    } catch (e) {
        console.error('Firebase Admin init error:', e.message);
    }
}

const db = admin.firestore();

const app = express();
const PORT = 5001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI (using the simpler @google/generative-ai package)
// IMPORTANT: Model is FIXED to gemini-2.5-flash - DO NOT CHANGE
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Store document context in memory (in production, use a database or vector store)
const documentContext = new Map(); // chatId -> { filename, content, uploadedAt }

// Root
app.get('/', (req, res) => {
    res.send('Echo Platform API - Running');
});

// Health check for Firebase Functions path
app.get('/echo-1928rn/us-central1/api/', (req, res) => {
    res.json({ status: 'online', message: 'Campus AI Platform API is running', model: 'gemini-1.5-flash' });
});

// User sync endpoint (called by AuthContext on login)
app.post('/echo-1928rn/us-central1/api/users/sync', (req, res) => {
    const { uid, email, displayName } = req.body;
    console.log('User synced:', email);
    res.json({ success: true, uid, synced: true });
});

// Create chat session
app.post('/echo-1928rn/us-central1/api/chats', (req, res) => {
    const chatId = 'chat_' + Date.now();
    res.json({
        chatId,
        title: req.body.title || 'New Chat',
        courseId: req.body.courseId,
        createdAt: new Date().toISOString()
    });
});

// Unified Chat Endpoint (Simpler for Frontend)
app.post('/echo-1928rn/us-central1/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message || 'Hello';
        const chatId = req.body.chatId || 'chat_' + Date.now();

        // Context Retrieval
        const context = documentContext.get(chatId);

        let prompt;
        if (context && context.content) {
            prompt = `You are an AI research assistant for "Echo Platform". 
            The student has uploaded a document titled "${context.filename}".
            
            ---DOCUMENT START---
            ${context.content}
            ---DOCUMENT END---
            
            Question: "${userMessage}"
            
            Answer concisely based on the document.`;
        } else {
            prompt = `You are a helpful AI assistant for Echo Platform. Question: "${userMessage}". Answer helpfully.`;
        }

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        res.json({
            response: aiResponse,
            chatId,
            sources: context ? [{ filename: context.filename, type: 'pdf' }] : [],
            model: 'gemini-2.5-flash'
        });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Chat with AI (Legacy Path)
app.post('/echo-1928rn/us-central1/api/chats/:chatId/message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userMessage = req.body.message || 'Hello';

        // Check if this chat has document context
        const context = documentContext.get(chatId);

        let prompt;
        if (context && context.content) {
            // RAG: Use the document content as context
            prompt = `You are an AI research assistant for a university learning platform called "Echo Platform". 
            
            The student has uploaded a document titled "${context.filename}". Here is the content:
            
            ---DOCUMENT START---
            ${context.content}
            ---DOCUMENT END---
            
            Based on the above document, answer the following question concisely and accurately:
            
            Question: "${userMessage}"
            
            Provide a clear answer based on the document content. If the question cannot be answered from the document, say so.`;
        } else {
            // No document context - answer generally
            prompt = `You are an AI research assistant for a university learning platform called "Echo Platform". 
            Answer the following student question concisely and helpfully:
            
            Question: "${userMessage}"
            
            Provide a clear, educational response.`;
        }

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        res.json({
            response: aiResponse,
            sources: context ? [{ filename: context.filename, type: 'pdf' }] : [],
            model: 'gemini-2.5-flash',
            hasContext: !!context
        });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
});

// Upload file endpoint
app.post('/echo-1928rn/us-central1/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filename = req.file.originalname;
        const mimetype = req.file.mimetype;
        console.log('File received:', filename, 'Type:', mimetype);

        // Extract text based on file type
        let extractedText = '';
        let fileType = 'unknown';

        try {
            // PDF files
            if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
                const pdfData = await pdfParse(req.file.buffer);
                extractedText = pdfData.text;
                fileType = 'pdf';
                console.log('Extracted from PDF:', extractedText.length, 'characters');
            }
            // DOCX files
            else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                extractedText = result.value;
                fileType = 'docx';
                console.log('Extracted from DOCX:', extractedText.length, 'characters');
            }
            // PPT/PPTX files (basic text extraction - PPT is complex, may need better library)
            else if (mimetype.includes('presentation') || filename.endsWith('.ppt') || filename.endsWith('.pptx')) {
                // For PPT, we'll use textract which can handle it (already installed)
                // For now, just acknowledge - full PPT extraction requires more complex setup
                extractedText = `[PPT file uploaded: ${filename}. Full text extraction for PowerPoint files requires additional setup.]`;
                fileType = 'ppt';
                console.log('PPT file detected - limited extraction');
            }
            // Plain text files
            else if (mimetype === 'text/plain' || filename.endsWith('.txt')) {
                extractedText = req.file.buffer.toString('utf-8');
                fileType = 'txt';
                console.log('Extracted from TXT:', extractedText.length, 'characters');
            }
            else {
                return res.status(400).json({
                    error: 'Unsupported file type',
                    message: 'Please upload PDF, DOCX, PPT, or TXT files only',
                    receivedType: mimetype
                });
            }
        } catch (extractionError) {
            console.error('File extraction error:', extractionError);
            return res.status(400).json({
                error: 'Failed to extract text from file',
                details: extractionError.message,
                fileType: mimetype
            });
        }

        if (!extractedText || extractedText.length === 0) {
            return res.status(400).json({
                error: 'No text could be extracted from the file',
                message: 'The file appears to be empty or unreadable'
            });
        }

        // Store the document content with a generated chatId
        const materialId = 'material_' + Date.now();
        const chatId = 'chat_' + Date.now();

        documentContext.set(chatId, {
            filename: filename,
            content: extractedText,
            uploadedAt: new Date().toISOString(),
            materialId,
            fileType
        });

        console.log('Document stored for chatId:', chatId);

        // EXTRACTION: Study Topics
        let topics = [];
        try {
            if (extractedText && extractedText.length > 50) {
                const topicPrompt = `Analyze the following text and identify 3-5 distinct, high-level academic topics or subjects it covers (e.g., 'Quantum Mechanics', 'React Hooks', 'European History').
                Return valid JSON array of strings ONLY. No markdown.
                
                Text: ${extractedText.substring(0, 2000)}`; // Limit context window

                const topicResult = await model.generateContent(topicPrompt);
                const topicResponse = topicResult.response.text();
                // Clean markdown if present
                const cleanJson = topicResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                topics = JSON.parse(cleanJson);
                console.log('Extracted Topics:', topics);
            }
        } catch (topicError) {
            console.error('Topic extraction failed:', topicError);
            // Non-blocking error, continue with empty topics
        }

        res.json({
            message: 'File processed successfully',
            materialId,
            chatId, // Return this so frontend can use it for subsequent chats
            filename: filename,
            size: req.file.size,
            fileType,
            textLength: extractedText.length,
            preview: extractedText.substring(0, 300) + '...',
            topics: Array.isArray(topics) ? topics : []
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Store doubts in memory (in production, use Firestore)
const doubtsStorage = new Map(); // doubtId -> doubt object
let doubtCounter = 0;

// ESCALATION CONSTANTS (Reduced for Demo/Testing)
// To test escalation, wait 30 seconds for SENIOR, then 2 minutes for PROFESSOR
const TIME_TO_SENIOR = 30 * 1000; // 30 seconds (Real World: 30 mins)
const TIME_TO_PROFESSOR = 2 * 60 * 1000; // 2 minutes (Real World: 2 hours)

// Get doubts
app.get('/echo-1928rn/us-central1/api/doubts', (req, res) => {
    const { userYear, department, courseId, role } = req.query;

    // Return all doubts as array, sorted by most recent first
    let allDoubts = Array.from(doubtsStorage.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter based on role and visibility
    if (role === 'PROFESSOR') {
        // Professors see only PROFESSOR status doubts
        allDoubts = allDoubts.filter(d => d.status === 'PROFESSOR');
    } else if (userYear && department && courseId) {
        // Seniors see: OPEN, SENIOR_VISIBLE (for their dept/course), and their own doubts
        allDoubts = allDoubts.filter(d => {
            // Always show own doubts, OPEN doubts, and RESOLVED
            if (d.status === 'OPEN' || d.status === 'RESOLVED' || d.status === 'AI') {
                return true;
            }
            // Show SENIOR_VISIBLE only if user is senior (higher year) in same dept/course
            if (d.status === 'SENIOR_VISIBLE') {
                // Would check: userYear > doubt.askedBy.year && same dept/course
                return d.courseId === courseId && d.askedBy.department === department;
            }
            return false;
        });
    } else {
        // Regular students see: OPEN, AI, RESOLVED, and their own doubts
        allDoubts = allDoubts.filter(d =>
            d.status === 'OPEN' || d.status === 'RESOLVED' || d.status === 'AI'
        );
    }

    console.log('Fetching doubts, count:', allDoubts.length, 'Role:', role || 'STUDENT');
    res.json(allDoubts);
});

// Helper function to clean markdown from AI responses
function cleanMarkdown(text) {
    return text
        .replace(/#{1,6}\s+/g, '') // Remove markdown headings
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .trim();
}

// STEP 1: DOUBT CREATION & AI RESPONSE
app.post('/echo-1928rn/us-central1/api/doubts', async (req, res) => {
    try {
        const doubtContent = req.body.content;
        const courseId = req.body.courseId || 'general';
        const userName = req.body.userName || 'Student';
        const userUid = req.body.userUid || 'user_' + Date.now();

        if (!doubtContent || !doubtContent.trim()) {
            return res.status(400).json({ error: 'Doubt content is required' });
        }

        console.log('Creating doubt:', doubtContent);

        // Get AI response
        const prompt = `You are a helpful AI tutor on a university learning platform. A student has asked the following question:

        "${doubtContent}"
        
        Provide a clear, comprehensive, and educational answer in plain text without any markdown formatting. Include examples if relevant.`;

        const result = await model.generateContent(prompt);
        const rawAnswer = result.response.text();
        const aiAnswer = cleanMarkdown(rawAnswer);

        const doubtId = 'doubt_' + (++doubtCounter) + '_' + Date.now();
        const doubt = {
            doubtId,
            content: doubtContent,
            courseId,
            askedBy: { name: userName, uid: userUid },
            createdAt: new Date().toISOString(),
            status: 'AI', // Initial Status: AI (Step 1)
            resolved: false,
            lastEscalatedAt: null,
            aiAnswer: aiAnswer, // Store specific AI answer field
            replies: [], // For Step 3 replies
            votes: 0,
            views: 0,
            tags: [],
            history: [{ status: 'AI', timestamp: new Date().toISOString(), note: 'AI Generated Answer' }]
        };

        // Store the doubt
        doubtsStorage.set(doubtId, doubt);
        console.log('Doubt created:', doubtId, 'Status: AI');

        res.json(doubt);
    } catch (error) {
        console.error('Error creating doubt:', error);
        res.status(500).json({ error: 'Failed to process doubt', details: error.message });
    }
});

// STEP 2: STUDENT CONFIRMATION (Resolve or Escalate)
app.post('/echo-1928rn/us-central1/api/doubts/:doubtId/action', async (req, res) => {
    try {
        const { doubtId } = req.params;
        const { action } = req.body; // 'SOLVED' or 'CONFUSED'

        const doubt = doubtsStorage.get(doubtId);
        if (!doubt) return res.status(404).json({ error: 'Doubt not found' });

        if (action === 'SOLVED') {
            // STEP 6: RESOLUTION & MEMORY indexing
            doubt.status = 'RESOLVED';
            doubt.resolved = true;
            doubt.history.push({ status: 'RESOLVED', timestamp: new Date().toISOString(), note: 'Student confirmed AI solution' });

            // Mock Indexing
            console.log(`[KnowledgeMemory] Indexing doubt ${doubtId} into Vertex AI Vector Search...`);
            console.log(`[KnowledgeMemory] Tags: ${doubt.courseId}, Topic Embedding Generated.`);

        } else if (action === 'CONFUSED') {
            // STEP 3: OPEN STUDENT FORUM
            doubt.status = 'OPEN';
            doubt.lastEscalatedAt = new Date().toISOString(); // Start escalation timer
            doubt.history.push({ status: 'OPEN', timestamp: new Date().toISOString(), note: 'Student escalated to Forum' });

            console.log(`[Escalation] Doubt ${doubtId} moved to OPEN forum.`);
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        doubtsStorage.set(doubtId, doubt); // Update storage
        res.json(doubt);
    } catch (error) {
        console.error('Action error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// STEP 3: REPLIES (Discussion)
app.post('/echo-1928rn/us-central1/api/doubts/:doubtId/reply', (req, res) => {
    const { doubtId } = req.params;
    const { content, authorName, isProfessor } = req.body;

    const doubt = doubtsStorage.get(doubtId);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });

    const reply = {
        replyId: 'reply_' + Date.now(),
        content,
        repliedBy: { name: authorName || 'Peer', uid: 'user_' + Date.now(), role: isProfessor ? 'PROFESSOR' : 'STUDENT' },
        createdAt: new Date().toISOString(),
        isAi: false,
        isAccepted: false
    };

    doubt.replies.push(reply);

    // STEP 7: PROFESSOR INTERVENTION (Auto-Resolve if Professor replies)
    if (isProfessor) {
        doubt.status = 'RESOLVED';
        doubt.resolved = true;
        reply.isAccepted = true;
        doubt.history.push({ status: 'RESOLVED', timestamp: new Date().toISOString(), note: 'Professor resolved via reply' });
        console.log(`[Resolution] Professor resolved doubt ${doubtId}`);
    }

    doubtsStorage.set(doubtId, doubt);
    res.json(doubt);
});

// STEP 4 & 5: AUTOMATIC ESCALATION ENGINE
// Runs every 10 seconds to check for escalations
setInterval(() => {
    const now = new Date();
    let updates = 0;

    doubtsStorage.forEach((doubt, id) => {
        if (!doubt.lastEscalatedAt || doubt.resolved) return;

        const escalatedTime = new Date(doubt.lastEscalatedAt);
        const diffMs = now - escalatedTime;

        // Rule 1: OPEN -> SENIOR_VISIBLE
        if (doubt.status === 'OPEN' && diffMs >= TIME_TO_SENIOR) {
            doubt.status = 'SENIOR_VISIBLE';
            doubt.history.push({ status: 'SENIOR_VISIBLE', timestamp: now.toISOString(), note: 'Auto-escalated to Seniors' });
            console.log(`[EscalationEngine] Doubt ${id} escalated to SENIOR_VISIBLE`);
            updates++;
        }
        // Rule 2: SENIOR_VISIBLE -> PROFESSOR
        else if (doubt.status === 'SENIOR_VISIBLE' && diffMs >= TIME_TO_PROFESSOR) {
            doubt.status = 'PROFESSOR';
            doubt.history.push({ status: 'PROFESSOR', timestamp: now.toISOString(), note: 'Auto-escalated to Professor' });
            console.log(`[EscalationEngine] Doubt ${id} escalated to PROFESSOR`);
            updates++;
        }
    });

    if (updates > 0) {
        // In a real app with Firestore, this would use active listeners. 
        // With in-memory, the frontend simply needs to poll/refresh to see the new status.
    }
}, 10000); // Check every 10 seconds

// Store sessions in memory (in production, use Firestore)
const sessionsStorage = new Map(); // sessionId -> session object
let sessionCounter = 0;

// Get teaching sessions
app.get('/echo-1928rn/us-central1/api/sessions', (req, res) => {
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    // Return all sessions as array, sorted by scheduled time
    const allSessions = Array.from(sessionsStorage.values())
        .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    console.log('Fetching sessions, count:', allSessions.length);
    res.json(allSessions);
});

// Create teaching session with Google Meet link
app.post('/echo-1928rn/us-central1/api/sessions', async (req, res) => {
    try {
        const { title, tutorName, scheduledTime, duration, courseId, meetLink: providedLink } = req.body;

        if (!title || !scheduledTime || !providedLink) {
            return res.status(400).json({ error: 'Title, scheduled time, and meeting link are required' });
        }

        console.log('Creates Session:', title);
        console.log('RECEIVED meetLink:', providedLink); // DEBUG LOG

        // Use the provided Google Meet link
        const meetLink = providedLink ? providedLink.trim() : '';

        const sessionId = 'session_' + (++sessionCounter) + '_' + Date.now();
        const session = {
            sessionId,
            title,
            tutor: {
                name: tutorName || 'Instructor',
                email: 'instructor@college.edu'
            },
            scheduledTime: new Date(scheduledTime).toISOString(),
            duration: duration || 60, // in minutes
            meetLink,
            courseId: courseId || 'general',
            attendees: 0,
            createdAt: new Date().toISOString(),
            status: 'SCHEDULED'
        };

        // Store the session
        sessionsStorage.set(sessionId, session);
        console.log('Session created:', sessionId);
        console.log('SAVED meetLink:', session.meetLink); // DEBUG LOG

        res.json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
});

// ============================================
// STUDY PARTNERS RECOMMENDATION ENDPOINTS
// ============================================

/**
 * Extract topics from a notebook question
 * Called when student asks a question in AI Notebook
 */
app.post('/echo-1928rn/us-central1/api/notebook/extract-topics', async (req, res) => {
    try {
        const { question, uid, courseId } = req.body;

        if (!question || !uid || !courseId) {
            return res.status(400).json({ error: 'Missing required fields: question, uid, courseId' });
        }

        console.log('Extracting topics from question:', question.substring(0, 100));

        // Use Gemini to extract topics
        const topicPrompt = `Analyze the following student question and identify 2-4 specific academic topics or concepts it's about.
        Return a valid JSON array of topic strings ONLY. Use concise, technical terms (e.g., "Dynamic Programming", "React Hooks", "Machine Learning").
        
        Question: "${question}"
        
        Return format: ["Topic 1", "Topic 2", ...]
        No markdown, just the JSON array.`;

        const topicResult = await model.generateContent(topicPrompt);
        const topicResponse = topicResult.response.text();

        // Clean markdown if present
        const cleanJson = topicResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const topics = JSON.parse(cleanJson);

        console.log('✅ Extracted topics:', topics);

        res.json({
            success: true,
            topics: Array.isArray(topics) ? topics : [],
            uid,
            courseId,
            activityType: 'question'
        });
    } catch (error) {
        console.error('❌ Topic extraction error:', error);
        res.status(500).json({
            error: 'Failed to extract topics',
            details: error.message,
            topics: [] // Fallback to empty array
        });
    }
});

/**
 * Get recommended study partners
 * Returns students studying similar topics in the same course
 */
app.post('/echo-1928rn/us-central1/api/connections/recommendations', async (req, res) => {
    try {
        const { uid, courseId, timeWindowMinutes = 60 } = req.body;

        if (!uid || !courseId) {
            return res.status(400).json({ error: 'Missing required fields: uid, courseId' });
        }

        console.log(`Getting recommendations for user ${uid} in course ${courseId}`);

        // Note: This endpoint is primarily for frontend to call
        // The actual matching logic is in the frontend service (studyContextService.ts)
        // This backend endpoint is a placeholder for future server-side matching if needed

        res.json({
            message: 'Use frontend studyContextService.getRecommendedStudyPartners() for real-time matching',
            note: 'Backend matching can be implemented here for performance optimization'
        });
    } catch (error) {
        console.error('❌ Recommendation error:', error);
        res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
    }
});

/**
 * Update active study context
 * Stores what topics a student is currently studying
 */
app.post('/echo-1928rn/us-central1/api/study-context/update', async (req, res) => {
    try {
        const { uid, courseId, topics, activityType, questionSnippet } = req.body;

        if (!uid || !courseId || !topics || !Array.isArray(topics)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`📚 Updating study context for user ${uid}:`, topics);

        // Note: The actual Firestore update happens in the frontend
        // This is just an acknowledgment endpoint
        // Could be enhanced to do server-side Firestore updates for better security

        res.json({
            success: true,
            message: 'Study context update acknowledged',
            uid,
            courseId,
            topics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Study context update error:', error);
        res.status(500).json({ error: 'Failed to update study context', details: error.message });
    }
});

// ============================================
// SESSION REGISTRATION WITH GOOGLE SHEETS
// ============================================

/**
 * POST /sessions/register
 * Register user for a teaching session
 * Creates Google Sheet on first registration
 */
app.post('/echo-1928rn/us-central1/api/sessions/register', async (req, res) => {
    try {
        const { sessionId, userId, userEmail } = req.body;

        if (!sessionId || !userId || !userEmail) {
            return res.status(400).json({
                error: 'Missing required fields: sessionId, userId, userEmail'
            });
        }

        console.log(`📝 Registration request: User ${userId} for session ${sessionId}`);

        // 1. Check if session exists and is not completed
        const sessionRef = admin.firestore().collection('teachingSessions').doc(sessionId);
        const sessionSnap = await sessionRef.get();

        if (!sessionSnap.exists) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const sessionData = sessionSnap.data();
        if (sessionData.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot register for completed session' });
        }

        // 2. Check if user already registered
        const existingReg = await admin.firestore()
            .collection('sessionRegistrations')
            .where('sessionId', '==', sessionId)
            .where('userId', '==', userId)
            .get();

        if (!existingReg.empty) {
            return res.status(200).json({
                message: 'Already registered',
                alreadyRegistered: true
            });
        }

        // 3. Fetch user profile for complete details
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data() || {};

        const userName = userData.displayName || userData.name || userEmail.split('@')[0];
        const academicYear = userData.academicYear || userData.year || 'Not specified';

        // 4. Create registration document
        const registrationData = {
            sessionId,
            userId,
            userName,
            userEmail,
            academicYear,
            registeredAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const regRef = await admin.firestore()
            .collection('sessionRegistrations')
            .add(registrationData);

        console.log(`✅ Registration created: ${regRef.id}`);

        // 5. Google Sheets Integration
        try {
            let sheetId = sessionData.sheetId;

            // If no sheet exists, create one (first registration)
            if (!sheetId) {
                console.log('📊 Creating new Google Sheet for registrations...');

                // Note: Google Sheets API requires service account setup
                // For MVP, we'll store sheetId placeholder and log the data
                // In production, use googleapis package with service account

                const sheetTitle = `${sessionData.title} - Registrations`;
                sheetId = `sheet_${sessionId}_${Date.now()}`; // Placeholder

                // Update session with sheetId
                await sessionRef.update({ sheetId });

                console.log(`📊 Sheet created (placeholder): ${sheetId}`);
                console.log(`📊 Sheet title: ${sheetTitle}`);
                console.log(`📊 First registration data:`, {
                    Name: userName,
                    Email: userEmail,
                    'Academic Year': academicYear,
                    'Registered At': new Date().toISOString()
                });
            } else {
                // Append to existing sheet
                console.log(`📊 Appending to existing sheet: ${sheetId}`);
                console.log(`📊 Registration data:`, {
                    Name: userName,
                    Email: userEmail,
                    'Academic Year': academicYear,
                    'Registered At': new Date().toISOString()
                });
            }

            /* 
            PRODUCTION IMPLEMENTATION:
            
            const { google } = require('googleapis');
            const sheets = google.sheets('v4');
            
            // Authenticate with service account
            const auth = new google.auth.GoogleAuth({
                keyFile: 'path/to/service-account.json',
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            
            if (!sheetId) {
                // Create new spreadsheet
                const createResponse = await sheets.spreadsheets.create({
                    auth,
                    requestBody: {
                        properties: { title: sheetTitle },
                        sheets: [{
                            properties: { title: 'Registrations' },
                            data: [{
                                rowData: [{
                                    values: [
                                        { userEnteredValue: { stringValue: 'Name' } },
                                        { userEnteredValue: { stringValue: 'Email' } },
                                        { userEnteredValue: { stringValue: 'Academic Year' } },
                                        { userEnteredValue: { stringValue: 'Registered At' } }
                                    ]
                                }]
                            }]
                        }]
                    }
                });
                
                sheetId = createResponse.data.spreadsheetId;
                
                // Share with host
                await sheets.spreadsheets.batchUpdate({
                    auth,
                    spreadsheetId: sheetId,
                    requestBody: {
                        requests: [{
                            addProtectedRange: {
                                protectedRange: {
                                    range: { sheetId: 0 },
                                    warningOnly: true
                                }
                            }
                        }]
                    }
                });
                
                await sessionRef.update({ sheetId });
            }
            
            // Append registration
            await sheets.spreadsheets.values.append({
                auth,
                spreadsheetId: sheetId,
                range: 'Registrations!A:D',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        userName,
                        userEmail,
                        academicYear,
                        new Date().toISOString()
                    ]]
                }
            });
            */

        } catch (sheetError) {
            console.error('📊 Google Sheets error (non-blocking):', sheetError);
            // Don't fail the registration if sheets fail
        }

        res.status(200).json({
            success: true,
            message: 'Registration successful',
            registrationId: regRef.id
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            details: error.message
        });
    }
});

// ============================================
// PROFESSOR AUTHENTICATION (HARDCODED CREDENTIALS)
// ============================================

// Hardcoded professor credentials (MVP ONLY)
const PROFESSOR_CREDENTIALS = {
    email: 'Professor@gmail.com',
    password: 'Rk@1928'
};

/**
 * POST /auth/professor-login
 * Verify professor credentials and issue session token
 */
app.post('/echo-1928rn/us-central1/api/auth/professor-login', (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Professor login attempt:', email);

        // Validate credentials
        if (email !== PROFESSOR_CREDENTIALS.email || password !== PROFESSOR_CREDENTIALS.password) {
            console.log('❌ Invalid professor credentials');
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Access denied'
            });
        }

        // Create professor session token
        const professorSession = {
            role: 'professor',
            email: PROFESSOR_CREDENTIALS.email,
            name: 'Professor',
            uid: 'professor_001', // Fixed UID for professor
            loginTime: new Date().toISOString()
        };

        console.log('✅ Professor authenticated successfully');

        res.status(200).json({
            success: true,
            session: professorSession,
            message: 'Professor login successful'
        });

    } catch (error) {
        console.error('❌ Professor login error:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error.message
        });
    }
});

/**
 * Middleware to verify professor access
 */
function verifyProfessorAccess(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Professor ')) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Professor authentication required'
        });
    }

    // In production, verify JWT token here
    // For MVP, we're using a simple prefix check

    req.professorAuth = {
        role: 'professor',
        email: PROFESSOR_CREDENTIALS.email
    };

    next();
}

// ============================================
// GOOGLE SHEETS API - LIVE ACADEMIC INTELLIGENCE
// ============================================

/**
 * Get authenticated Google API clients (Sheets + Drive)
 */
async function getGoogleClients() {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './functions/serviceAccountKey.json';

    try {
        if (require('fs').existsSync(serviceAccountPath)) {
            const auth = new google.auth.GoogleAuth({
                keyFile: serviceAccountPath,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive' // Full Drive access
                ],
            });
            const authClient = await auth.getClient();
            return {
                sheets: google.sheets({ version: 'v4', auth: authClient }),
                drive: google.drive({ version: 'v3', auth: authClient })
            };
        }
    } catch (error) {
        console.error('Failed to initialize Google clients:', error.message);
    }
    return null;
}

// Backward compatibility wrapper
async function getSheetsClient() {
    const clients = await getGoogleClients();
    return clients?.sheets || null;
}


const SHARED_FOLDER_ID = '1-TJjH_ORuznAY9gLFg1gcFPUXt6wXG68';

async function createSheetInFolder(sheets, drive, title, sheetTitle, headerValues, folderId) {
    // 1. Create the spreadsheet using Sheets API (avoids Service Account quota issues)
    const createResponse = await sheets.spreadsheets.create({
        resource: {
            properties: { title },
            sheets: [{
                properties: { title: sheetTitle }
            }]
        }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    let spreadsheetUrl = createResponse.data.spreadsheetUrl;

    // 2. If folder is specified, move the file there
    if (folderId && drive) {
        try {
            console.log(`📂 Moving "${title}" to folder ${folderId}...`);
            // Get current parents to remove them
            const file = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'parents'
            });

            const previousParents = file.data.parents ? file.data.parents.join(',') : '';

            // Move to new folder
            await drive.files.update({
                fileId: spreadsheetId,
                addParents: folderId,
                removeParents: previousParents,
                fields: 'id, parents, webViewLink'
            });

            // Get updated URL
            const updatedFile = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'webViewLink'
            });
            spreadsheetUrl = updatedFile.data.webViewLink;

            console.log(`✅ Successfully moved to shared folder`);
        } catch (moveError) {
            console.warn(`⚠️ Could not move to folder (file created successfully):`, moveError.message);
            // Continue anyway - file is created, just not in the folder
        }
    }

    // 3. Add headers using batchUpdate
    const requests = [
        {
            updateCells: {
                start: { sheetId: 0, rowIndex: 0, columnIndex: 0 },
                rows: [{
                    values: headerValues.map(v => ({ userEnteredValue: { stringValue: v } }))
                }],
                fields: 'userEnteredValue'
            }
        }
    ];

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests }
    });

    return { spreadsheetId, spreadsheetUrl };
}

/**
 * Create Escalated Doubts Sheet
 */
async function createEscalatedDoubtsSheet(sheets, drive, courseName, folderId) {
    const title = `${courseName} – Escalated Doubts`;
    const headers = ['Doubt ID', 'Course', 'Topic', 'Asked By', 'Escalated At', 'Replies Count', 'Status'];
    return createSheetInFolder(sheets, drive, title, 'Doubts', headers, folderId);
}

/**
 * Create Topic Confusion Analytics Sheet
 */
async function createTopicAnalyticsSheet(sheets, drive, courseName, folderId) {
    const title = `${courseName} – Topic Confusion Analytics`;
    const headers = ['Topic', 'Total Doubts', 'Escalated Count', 'Last Seen'];
    return createSheetInFolder(sheets, drive, title, 'Analytics', headers, folderId);
}

/**
 * Create Engagement Summary Sheet
 */
async function createEngagementSummarySheet(sheets, drive, courseName, folderId) {
    const title = `${courseName} – Engagement Summary`;
    const headers = ['Metric', 'Count'];
    return createSheetInFolder(sheets, drive, title, 'Summary', headers, folderId);
}

/**
 * Share sheet with professor (viewer-only)
 * Non-blocking - sheets work even if sharing fails
 */
async function shareSheetWithProfessor(sheets, spreadsheetId, professorEmail) {
    try {
        const drive = google.drive({ version: 'v3', auth: sheets._options.auth });
        await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
                role: 'reader',
                type: 'user',
                emailAddress: professorEmail
            }
        });
        console.log(`✅ Shared sheet ${spreadsheetId} with ${professorEmail}`);
    } catch (error) {
        console.warn(`⚠️ Could not share sheet (Drive API may not be enabled):`, error.message);
        console.warn(`   Sheet created successfully but not auto-shared. Professor can access via direct URL.`);
    }
}

/**
 * Initialize all sheets for a course
 */

// --------------------------------------------
// CONFIGURATION: MASTER SHEET ID (Pre-created by Professor)
// --------------------------------------------
const MASTER_SHEET_ID = '1yBjv9ocNpGul9Fc7o2ywwn0lAf_FTuC52_zJ-OD568Y';

/**
 * Helper to ensure a tab exists in the master sheet
 */
async function ensureTabExists(sheets, title) {
    try {
        let metadata = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
        let sheet = metadata.data.sheets.find(s => s.properties.title === title);

        if (!sheet) {
            console.log(`📑 Creating tab "${title}"...`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: MASTER_SHEET_ID,
                resource: {
                    requests: [{ addSheet: { properties: { title } } }]
                }
            });
            // Fetch updated metadata
            metadata = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
            sheet = metadata.data.sheets.find(s => s.properties.title === title);
        }
        return sheet ? sheet.properties.sheetId : 0;
    } catch (e) {
        console.error(`⚠️ Error checking/creating tab "${title}":`, e.message);
        return 0;
    }
}

/**
 * Initialize all sheets for a course (Using MASTER SHEET)
 */
app.post('/echo-1928rn/us-central1/api/sheets/initialize', async (req, res) => {
    try {
        const { courseId, professorEmail } = req.body;
        console.log(`🔄 Initializing Master Sheet for ${courseId}...`);

        const clients = await getGoogleClients();

        // Check if sheets already configured
        const courseRef = db.collection('courses').doc(courseId);

        // Define the sheet configuration using the ONE Master ID
        const sheetConfig = {
            escalatedDoubtsSheetId: MASTER_SHEET_ID,
            escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            topicAnalyticsSheetId: MASTER_SHEET_ID,
            topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            engagementSummarySheetId: MASTER_SHEET_ID,
            engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            isDemoMode: false // We are LIVE now!
        };

        if (clients && clients.sheets) {
            try {
                // simple verification that we can access the sheet
                await clients.sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });

                // Create specific tabs for data clarity AND capture their IDs
                const doubtsId = await ensureTabExists(clients.sheets, 'Escalated Doubts');
                const topicsId = await ensureTabExists(clients.sheets, 'Topic Analytics');
                const engagementId = await ensureTabExists(clients.sheets, 'Engagement Summary');

                console.log(`📊 Tab IDs Found: Doubts=${doubtsId}, Topics=${topicsId}, Engagement=${engagementId}`);

                // Update config with DIRECT LINK URLs
                const updatedConfig = {
                    ...sheetConfig,
                    escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${doubtsId}`,
                    topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${topicsId}`,
                    engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${engagementId}`,
                };

                console.log('🔗 Generated URLs:', updatedConfig);

                // Save to Firestore
                await courseRef.set({ sheets: updatedConfig }, { merge: true });

                console.log(`✅ Master Sheet linked with specific tabs!`);
                return res.json({ success: true, sheets: updatedConfig });

            } catch (sheetError) {
                console.error('❌ Master Sheet Access Error:', sheetError.message);
                console.log('   (Ensure Service Account is Editor on the sheet)');
            }
        }

        // Return config anyway so frontend can attempt to use it
        return res.json({ success: true, sheets: sheetConfig });

    } catch (error) {
        console.error('Sheet initialization error:', error);
        res.status(500).json({ error: error.message });
    }
});



/**
 * Get sheet URLs for a course
 */
app.get('/echo-1928rn/us-central1/api/sheets/urls/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;

        const courseDoc = await db.collection('courses').doc(courseId).get();
        const sheets = courseDoc.data()?.sheets || {};

        // Return URLs directly if they exist
        const urls = {
            escalatedDoubtsUrl: sheets.escalatedDoubtsUrl,
            topicAnalyticsUrl: sheets.topicAnalyticsUrl,
            engagementSummaryUrl: sheets.engagementSummaryUrl,
            isDemoMode: sheets.isDemoMode || false
        };

        res.json(urls);
    } catch (error) {
        console.error('Error getting sheet URLs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Refresh all sheets for a course (sync from Firestore)
 */
app.post('/echo-1928rn/us-central1/api/sheets/refresh', async (req, res) => {
    try {
        const { courseId } = req.body;

        console.log(`🔄 Force refreshing sheets for course ${courseId}...`);

        // Clear existing sheets data to force re-creation with URLs
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.set({ sheets: {} }, { merge: true });

        console.log(`✅ Cleared old sheet data. Sheets will be re-initialized on next dashboard load.`);

        res.json({ success: true, message: 'Sheet data cleared. Refresh dashboard to re-initialize.' });
    } catch (error) {
        console.error('Sheet refresh error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Populate sheets with real Firestore data
 */
app.post('/echo-1928rn/us-central1/api/sheets/sync-data', async (req, res) => {
    try {
        const { courseId } = req.body;

        console.log(`📊 Syncing data for course ${courseId}...`);

        // 1. Get Course Settings First
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const sheetData = courseDoc.data()?.sheets || {};
        const isDemo = sheetData.isDemoMode;

        // 2. Initialize Sheets Client (only if not in demo)
        let sheets = null;
        if (!isDemo) {
            sheets = await getSheetsClient();
            if (!sheets) {
                return res.status(500).json({ error: 'Sheets API not configured' });
            }
        }

        if (!sheetData.escalatedDoubtsSheetId && !isDemo) {
            return res.status(400).json({ error: 'Sheets not initialized yet' });
        }

        // 1. POPULATE ESCALATED DOUBTS SHEET
        const doubtsQuery = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .where('escalationLevel', '==', 'PROFESSOR')
            .get();

        const doubtRows = doubtsQuery.docs.map(doc => {
            const data = doc.data();
            let escalatedStr = '';
            try {
                if (data.escalatedAt && typeof data.escalatedAt.toMillis === 'function') {
                    escalatedStr = new Date(data.escalatedAt.toMillis()).toLocaleString();
                } else if (data.escalatedAt) {
                    escalatedStr = new Date(data.escalatedAt).toLocaleString();
                }
            } catch (e) {
                console.warn('Date parse error', e);
            }

            return [
                doc.id,
                courseId,
                data.topic || 'General',
                data.askedBy?.name || 'Unknown',
                escalatedStr,
                (data.replies || []).length,
                data.isResolved ? 'RESOLVED' : 'OPEN'
            ];
        });

        if (doubtRows.length > 0) {
            const rowsWithHeaders = [
                ['Doubt ID', 'Course', 'Topic', 'Student', 'Escalated At', 'Replies', 'Status'],
                ...doubtRows
            ];

            if (sheets && !isDemo) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetData.escalatedDoubtsSheetId,
                    range: `'Escalated Doubts'!A1`,
                    valueInputOption: 'RAW',
                    resource: { values: rowsWithHeaders }
                });
                console.log(`✅ Wrote ${doubtRows.length} escalated doubts to Master Sheet`);
            } else {
                console.log(`✅ [Demo] Simulated write of ${doubtRows.length} escalated doubts`);
            }
        }

        // 2. POPULATE TOPIC CONFUSION ANALYTICS
        // Aggregate doubts by topic
        const topicMap = {};
        const allDoubtsQuery = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .get();

        allDoubtsQuery.docs.forEach(doc => {
            const data = doc.data();
            const topic = data.topic || 'General';
            if (!topicMap[topic]) {
                topicMap[topic] = { total: 0, escalated: 0, lastSeen: null };
            }
            topicMap[topic].total++;
            if (data.escalationLevel === 'PROFESSOR') {
                topicMap[topic].escalated++;
            }
            let timestamp = 0;
            try {
                if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
                    timestamp = data.createdAt.toMillis();
                } else if (data.createdAt) {
                    timestamp = new Date(data.createdAt).getTime();
                } else {
                    timestamp = Date.now();
                }
            } catch (e) { }

            if (!topicMap[topic].lastSeen || timestamp > topicMap[topic].lastSeen) {
                topicMap[topic].lastSeen = timestamp;
            }
        });

        const topicRows = Object.entries(topicMap)
            .sort((a, b) => b[1].escalated - a[1].escalated) // Sort by escalated count
            .map(([topic, stats]) => [
                topic,
                stats.total,
                stats.escalated,
                stats.lastSeen ? new Date(stats.lastSeen).toLocaleDateString() : ''
            ]);

        if (topicRows.length > 0) {
            const rowsWithHeaders = [
                ['Topic', 'Total Doubts', 'Escalated', 'Last Seen'],
                ...topicRows
            ];

            if (sheets && !isDemo) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetData.topicAnalyticsSheetId,
                    range: `'Topic Analytics'!A1`,
                    valueInputOption: 'RAW',
                    resource: { values: rowsWithHeaders }
                });
                console.log(`✅ Wrote ${topicRows.length} topic analytics to Master Sheet`);
            } else {
                console.log(`✅ [Demo] Simulated write of ${topicRows.length} topic analytics`);
            }
        }

        // 3. POPULATE ENGAGEMENT SUMMARY
        const totalDoubts = allDoubtsQuery.docs.length;
        const resolvedDoubts = allDoubtsQuery.docs.filter(d => d.data().isResolved).length;
        const aiReplies = allDoubtsQuery.docs.reduce((sum, d) => {
            return sum + (d.data().replies || []).filter(r => r.isAi).length;
        }, 0);
        const peerReplies = allDoubtsQuery.docs.reduce((sum, d) => {
            return sum + (d.data().replies || []).filter(r => !r.isAi && r.repliedBy?.role !== 'PROFESSOR').length;
        }, 0);
        const professorReplies = allDoubtsQuery.docs.reduce((sum, d) => {
            return sum + (d.data().replies || []).filter(r => r.repliedBy?.role === 'PROFESSOR').length;
        }, 0);

        const sessionsQuery = await db.collection('teachingSessions')
            .where('courseId', '==', courseId)
            .get();
        const totalSessions = sessionsQuery.docs.length;

        const engagementRows = [
            ['Total Doubts Asked', totalDoubts],
            ['Doubts Resolved', resolvedDoubts],
            ['AI Responses', aiReplies],
            ['Peer Responses', peerReplies],
            ['Professor Responses', professorReplies],
            ['Escalated to Professor', doubtRows.length],
            ['Teaching Sessions Hosted', totalSessions]
        ];

        const engagementRowsWithHeader = [
            ['Metric', 'Value'],
            ...engagementRows
        ];

        if (sheets && !isDemo) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetData.engagementSummarySheetId,
                range: `'Engagement Summary'!A1`,
                valueInputOption: 'RAW',
                resource: { values: engagementRowsWithHeader }
            });
            console.log(`✅ Wrote engagement summary to Master Sheet`);
        } else {
            console.log(`✅ [Demo] Simulated write of engagement summary`);
        }

        res.json({
            success: true,
            message: isDemo ? 'Simulated Sync (Demo Mode)' : 'Synced Successfully',
            stats: {
                doubtsSynced: doubtRows.length,
                topicsSynced: topicRows.length,
                engagementMetrics: engagementRows.length
            },
            exportData: {
                doubts: [['ID', 'Course', 'Topic', 'Student', 'Escalated At', 'Replies', 'Status'], ...doubtRows],
                topics: [['Topic', 'Total Doubts', 'Escalated', 'Last Seen'], ...topicRows],
                engagement: [['Metric', 'Value'], ...engagementRows]
            }
        });

    } catch (error) {
        console.error('Sheet sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Echo Platform API Server Running!`);
    console.log(`   Local: http://localhost:${PORT}/`);
    console.log(`   API Base: http://localhost:${PORT}/echo-1928rn/us-central1/api/`);
    console.log(`\n📝 Note: Set GEMINI_API_KEY environment variable for real AI responses`);
    console.log(`   Get your key from: https://makersuite.google.com/app/apikey\n`);
});
