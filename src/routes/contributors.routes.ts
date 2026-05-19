import { Router } from 'express';
import { contributorsController } from '../controllers/contributors.controller';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', contributorsController.getContributors);
router.post('/refresh', requireAdmin, contributorsController.refresh);

export default router;
