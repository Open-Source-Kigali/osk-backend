import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { requireAdmin } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/', upload.single('file'), reviewController.createReview);
router.put('/:id', requireAdmin, upload.single('file'), reviewController.updateReview);
router.delete('/:id', requireAdmin, reviewController.deleteReview);

export default router;
