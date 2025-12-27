import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { vertexService } from './vertexService';

interface Chunk {
    id: string;
    text: string;
    courseId: string;
    materialId: string;
    embedding: number[];
}

export const processMaterial = async (courseId: string, materialId: string, gcsPath: string, mimeType: string) => {
    try {
        console.log(`Starting ingestion for ${materialId}`);
        const materialRef = db.collection('courses').doc(courseId).collection('materials').doc(materialId);

        // 1. Download file content (simplified for text/pdf)
        const bucket = admin.storage().bucket();
        const file = bucket.file(gcsPath);
        const [buffer] = await file.download();

        // 2. Extract Text
        // TODO: For PDFs, use Document AI. For MVP, we presume simple text or use a basic parser.
        // Doing a simple string conversion for MVP if text/plain, else mock.
        let fullText = "";

        if (mimeType === 'text/plain' || mimeType === 'application/markdown') {
            fullText = buffer.toString('utf-8');
        } else if (mimeType === 'application/pdf') {
            try {
                // Dynamically import or require to ensure it works
                const pdf = require('pdf-parse');
                const data = await pdf(buffer);
                fullText = data.text;
                console.log(`Extracted ${fullText.length} chars from PDF`);
            } catch (err) {
                console.error('PDF parsing failed:', err);
                fullText = "Error parsing PDF content.";
            }
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            mimeType === 'application/vnd.ms-powerpoint'
        ) {
            try {
                const getText = require('office-text-extractor');
                // office-text-extractor expects a file path or buffer. 
                // Since we have a buffer, we might need to write it to temp file or see if it accepts buffer.
                // Checking docs: it accepts file path. So we need to write to temp.
                const fs = require('fs');
                const os = require('os');
                const path = require('path');
                const tempFilePath = path.join(os.tmpdir(), `temp_${materialId}.pptx`);

                fs.writeFileSync(tempFilePath, buffer);
                fullText = await getText(tempFilePath);
                fs.unlinkSync(tempFilePath); // Cleanup

                console.log(`Extracted ${fullText.length} chars from PPTX`);
            } catch (err: any) {
                console.error('PPTX parsing failed:', err);
                fullText = `Error parsing PPTX: ${err.message}`;
            }
        } else {
            // Fallback for other types
            fullText = buffer.toString('utf-8'); // Try text anyway
            if (fullText.length > 100000) fullText = "File too large or binary.";
        }

        // 3. Chunking
        // Split by paragraph or ~500 chars
        const rawChunks = fullText.split(/\n\s*\n/);
        const chunks: Chunk[] = [];

        for (const [index, text] of rawChunks.entries()) {
            if (text.trim().length < 50) continue; // Skip tiny chunks

            // 4. Generate Embedding
            const embedding = await vertexService.getEmbeddings(text);

            chunks.push({
                id: `${materialId}_${index}`,
                text: text,
                courseId,
                materialId,
                embedding
            });
        }

        // 5. Store Metadata in Firestore (for RAG retrieval mainly via Vector Search, but we store text here for reference)
        const batch = db.batch();
        for (const chunk of chunks) {
            const chunkRef = db.collection('courses').doc(courseId).collection('chunks').doc(chunk.id);
            batch.set(chunkRef, {
                text: chunk.text,
                materialId: chunk.materialId,
                vector: chunk.embedding // In real Vector Search, this goes to the Index Endpoint, not just Firestore
            });
        }
        await batch.commit();

        // 6. Update Status
        await materialRef.update({
            status: 'processed',
            chunkCount: chunks.length,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Ingestion complete for ${materialId}. Processed ${chunks.length} chunks.`);

    } catch (error) {
        console.error('Ingestion failed:', error);
        await db.collection('courses').doc(courseId).collection('materials').doc(materialId).update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
