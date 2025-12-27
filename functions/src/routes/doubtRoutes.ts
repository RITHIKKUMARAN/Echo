import { Router } from 'express';
import { createDoubt, getDoubts } from '../controllers/doubtController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(validateToken);
router.post('/', createDoubt);
router.get('/', getDoubts);

export default router;
