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
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

// Get doubts
app.get('/echo-1928rn/us-central1/api/doubts', (req, res) => {
    // Sample doubts - in production this would query Firestore
    res.json([
        {
            doubtId: 'doubt_1',
            courseId: 'cs101',
            content: 'How does backpropagation work in neural networks?',
            askedBy: { name: 'Student A', uid: 'user1' },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'AI_ANSWERED',
            replies: [{
                isAi: true,
                content: 'Backpropagation is an algorithm used to train neural networks by calculating gradients of the loss function with respect to each weight...',
                createdAt: new Date(Date.now() - 3500000).toISOString(),
                repliedBy: { uid: 'ai-bot', name: 'Campus AI' }
            }],
            votes: 5,
            views: 12
        }
    ]);
});

// Create doubt with AI response
app.post('/echo-1928rn/us-central1/api/doubts', async (req, res) => {
    try {
        const doubtContent = req.body.content;

        // Get AI response
        const prompt = `You are a helpful AI tutor. A student has asked: "${doubtContent}"
        
        Provide a clear, concise, and helpful answer.`;

        const result = await model.generateContent(prompt);
        const aiAnswer = result.response.text();

        const doubt = {
            doubtId: 'doubt_' + Date.now(),
            content: doubtContent,
            courseId: req.body.courseId || 'general',
            askedBy: { name: 'Current User', uid: 'user_' + Date.now() },
            createdAt: new Date().toISOString(),
            status: 'AI_ANSWERED',
            replies: [{
                isAi: true,
                content: aiAnswer,
                createdAt: new Date().toISOString(),
                repliedBy: { uid: 'ai-bot', name: 'Campus AI' }
            }],
            votes: 0,
            views: 1
        };

        res.json(doubt);
    } catch (error) {
        console.error('Error creating doubt:', error);
        res.status(500).json({ error: 'Failed to process doubt', details: error.message });
    }
});

// Get teaching sessions
app.get('/echo-1928rn/us-central1/api/sessions', (req, res) => {
    res.json([
        {
            sessionId: 'session_1',
            title: 'Advanced Neural Networks',
            tutor: { name: 'Dr. Smith', email: 'smith@college.edu' },
            scheduledTime: new Date(Date.now() + 7200000).toISOString(),
            meetLink: 'https://meet.google.com/sample-link',
            attendees: 15
        }
    ]);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Echo Platform API Server Running!`);
    console.log(`   Local: http://localhost:${PORT}/`);
    console.log(`   API Base: http://localhost:${PORT}/echo-1928rn/us-central1/api/`);
    console.log(`\n📝 Note: Set GEMINI_API_KEY environment variable for real AI responses`);
    console.log(`   Get your key from: https://makersuite.google.com/app/apikey\n`);
});
