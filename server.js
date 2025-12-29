require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // For DOCX files

const app = express();
const PORT = 5001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI (using the simpler @google/generative-ai package)
// You'll need to set your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

// Chat with AI
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
            model: 'gemini-1.5-flash',
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

        res.json({
            message: 'File processed successfully',
            materialId,
            chatId, // Return this so frontend can use it for subsequent chats
            filename: filename,
            size: req.file.size,
            fileType,
            textLength: extractedText.length,
            preview: extractedText.substring(0, 300) + '...'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Store doubts in memory (in production, use Firestore)
const doubtsStorage = new Map(); // doubtId -> doubt object
let doubtCounter = 0;

// Get doubts
app.get('/echo-1928rn/us-central1/api/doubts', (req, res) => {
    // Return all doubts as array, sorted by most recent first
    const allDoubts = Array.from(doubtsStorage.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('Fetching doubts, count:', allDoubts.length);
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

// Create doubt with AI response
app.post('/echo-1928rn/us-central1/api/doubts', async (req, res) => {
    try {
        const doubtContent = req.body.content;
        const courseId = req.body.courseId || 'general';

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
        const aiAnswer = cleanMarkdown(rawAnswer); // Clean the response

        const doubtId = 'doubt_' + (++doubtCounter) + '_' + Date.now();
        const doubt = {
            doubtId,
            content: doubtContent,
            courseId,
            askedBy: { name: 'Student', uid: 'user_' + Date.now() },
            createdAt: new Date().toISOString(),
            status: 'AI_ANSWERED',
            replies: [{
                isAi: true,
                content: aiAnswer,
                createdAt: new Date().toISOString(),
                repliedBy: { uid: 'ai-bot', name: 'Campus AI' }
            }],
            votes: 0,
            views: 0,
            tags: []
        };

        // Store the doubt
        doubtsStorage.set(doubtId, doubt);
        console.log('Doubt created:', doubtId, '- Total doubts:', doubtsStorage.size);

        res.json(doubt);
    } catch (error) {
        console.error('Error creating doubt:', error);
        res.status(500).json({ error: 'Failed to process doubt', details: error.message });
    }
});

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

app.listen(PORT, () => {
    console.log(`\n🚀 Echo Platform API Server Running!`);
    console.log(`   Local: http://localhost:${PORT}/`);
    console.log(`   API Base: http://localhost:${PORT}/echo-1928rn/us-central1/api/`);
    console.log(`\n📝 Note: Set GEMINI_API_KEY environment variable for real AI responses`);
    console.log(`   Get your key from: https://makersuite.google.com/app/apikey\n`);
});
