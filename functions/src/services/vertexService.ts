import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
// Note: These values should be in environment variables
const project = process.env.GCP_PROJECT_ID || 'echo-1928rn';
const location = process.env.GCP_LOCATION || 'us-central1';

const vertex_ai = new VertexAI({ project: project, location: location });

// Gemini Model for Generation
const generativeModel = vertex_ai.getGenerativeModel({
    model: 'gemini-1.5-pro-preview-0409',
    generationConfig: {
        'maxOutputTokens': 2048,
        'temperature': 0.7,
        'topP': 0.8,
    },
});

// Embedding Model
const embeddingModel = vertex_ai.getGenerativeModel({ model: 'text-embedding-004' });

async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const result = await (embeddingModel as any).embedContent(text);

        if (!result.embedding || !result.embedding.values) {
            throw new Error('No embedding generated');
        }

        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        // Fallback for dev/mock if API fails (e.g. no creds)
        // return new Array(768).fill(0); 
        throw error;
    }
}

async function generateContent(prompt: string): Promise<string> {
    try {
        const resp = await generativeModel.generateContent(prompt);
        const aggregatedResponse = await resp.response;

        if (!aggregatedResponse.candidates || aggregatedResponse.candidates.length === 0) {
            return "I couldn't generate a response at this time.";
        }

        const text = aggregatedResponse.candidates[0].content.parts[0].text;
        return text || "";
    } catch (error) {
        console.error('Error in Gemini generation:', error);
        return "I encountered an error while thinking.";
    }
}

export const vertexService = {
    getEmbeddings,
    generateContent
};
