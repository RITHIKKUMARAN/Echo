const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors({ origin: true }));
app.use(express.json());

// Set Google Cloud credentials with absolute path
const credentialsPath = path.join(__dirname, 'functions', 'serviceAccountKey.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
console.log('Using credentials from:', credentialsPath);

// Initialize Vertex AI
const project = 'echo-1928rn';
const location = 'us-central1';
const vertexAI = new VertexAI({ project, location });

// Gemini 1.5 Flash model
const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
    },
});

// Root
app.get('/', (req, res) => {
    res.send('Echo Platform API - Dev Server Running');
});

// Firebase Functions path structure: /project-id/region/function-name
app.get('/echo-1928rn/us-central1/api/', (req, res) => {
    res.send('Campus AI Platform API is running');
});

app.post('/echo-1928rn/us-central1/api/chats', (req, res) => {
    res.json({ chatId: 'chat_' + Date.now(), title: req.body.title || 'New Chat', courseId: req.body.courseId });
});

app.post('/echo-1928rn/us-central1/api/chats/:chatId/message', async (req, res) => {
    try {
        const userMessage = req.body.message || 'Hello';

        const prompt = `You are an AI research assistant for a university learning platform called "Echo Platform". 
        Answer the following student question concisely and helpfully:
        
        Question: "${userMessage}"
        
        Provide a clear, educational response.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const aiResponse = response.candidates[0].content.parts[0].text;

        res.json({
            response: aiResponse,
            sources: []
        });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
});

app.post('/echo-1928rn/us-central1/api/upload', (req, res) => {
    res.json({ message: 'File upload endpoint - needs multer middleware', materialId: 'test_' + Date.now() });
});

app.get('/echo-1928rn/us-central1/api/doubts', (req, res) => {
    res.json([
        {
            doubtId: 'doubt_1',
            courseId: 'test',
            content: 'How does the neural network work?',
            askedBy: { name: 'Test User', uid: 'test123' },
            createdAt: new Date().toISOString(),
            status: 'AI_ANSWERED',
            replies: [{
                isAi: true,
                content: 'A neural network is a computational model inspired by biological neurons...',
                createdAt: new Date().toISOString()
            }],
            votes: 5,
            views: 12
        }
    ]);
});

app.post('/echo-1928rn/us-central1/api/doubts', async (req, res) => {
    try {
        const doubtContent = req.body.content;

        // Get AI response for the doubt
        const prompt = `You are a helpful AI tutor. A student has asked the following question:
        
        "${doubtContent}"
        
        Provide a clear, concise, and helpful answer.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const aiAnswer = response.candidates[0].content.parts[0].text;

        res.json({
            doubtId: 'doubt_' + Date.now(),
            content: doubtContent,
            courseId: req.body.courseId,
            askedBy: { name: 'Dev User', uid: 'dev123' },
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
        });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: 'Failed to process doubt',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Dev Server running at http://localhost:${PORT}/`);
    console.log(`   API endpoints available at: http://localhost:${PORT}/echo-1928rn/us-central1/api/`);
    console.log(`   ✅ Using real Gemini 1.5 Flash API!\n`);
});


