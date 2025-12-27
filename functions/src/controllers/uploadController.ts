import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { db, storage } from '../config/firebase';
import { processMaterial } from '../services/ingestionService';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        console.log('=== UPLOAD FILE CALLED ===');

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const file = req.file;
        const { courseId } = req.body;
        const targetCourseId = courseId || 'default_course_id';
        const fileName = file.originalname;
        const filePath = `course-materials/${targetCourseId}/${fileName}`;

        console.log(`Processing upload for ${fileName} to ${targetCourseId}`);

        // 1. Upload to Firebase Storage (Server-Side)
        // Ensure we specify the bucket if not default in emulator
        const bucket = storage.bucket('echo-1928rn.firebasestorage.app');
        const fileRef = bucket.file(filePath);

        await fileRef.save(file.buffer, {
            contentType: file.mimetype,
            metadata: {
                contentType: file.mimetype
            }
        });

        console.log('File saved to storage:', filePath);

        // 2. Create Firestore Record
        const materialRef = db.collection('courses').doc(targetCourseId).collection('materials').doc();
        await materialRef.set({
            title: fileName,
            filePath: filePath,
            contentType: file.mimetype,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'processing',
            size: file.size
        });

        console.log('Metadata created:', materialRef.id);

        // 3. Trigger Ingestion Directly (Robustness)
        // Run in background so we don't block response
        processMaterial(targetCourseId, materialRef.id, filePath, file.mimetype)
            .then(() => console.log('Ingestion finished for', materialRef.id))
            .catch(err => console.error('Ingestion failed for', materialRef.id, err));

        return res.status(201).json({
            message: 'File uploaded and processing started',
            materialId: materialRef.id,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
