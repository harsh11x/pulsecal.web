import { Response, NextFunction } from 'express';
import { createReview, getReviews } from './reviews.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const createReviewSchema = Joi.object({
    doctorId: Joi.string().required(),
    appointmentId: Joi.string().optional(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().optional(),
});

export const createReviewController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { error, value } = createReviewSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }
        const review = await createReview(req.user.id, value);
        sendSuccess(res, review, 'Review submitted successfully', 201);
    } catch (err) {
        next(err);
    }
};

export const getReviewsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            throw new AppError('Doctor ID is required', 400);
        }
        const reviews = await getReviews(doctorId as string);
        sendSuccess(res, reviews, 'Reviews retrieved successfully');
    } catch (err) {
        next(err);
    }
};
