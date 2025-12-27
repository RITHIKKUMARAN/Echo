import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController';

const router = Router();
// Use memory storage to process file buffer directly
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// POST /api/upload
router.post('/', upload.single('file'), uploadFile);

export default router;
