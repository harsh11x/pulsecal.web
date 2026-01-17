import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

export const createReview = async (patientId: string, data: {
    doctorId: string;
    appointmentId?: string;
    rating: number;
    comment?: string;
}) => {
    // Verify doctor exists
    const doctor = await prisma.user.findUnique({
        where: { id: data.doctorId },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
        throw new AppError('Invalid doctor ID', 404);
    }

    // Create review
    const review = await prisma.review.create({
        data: {
            patientId,
            doctorId: data.doctorId,
            appointmentId: data.appointmentId,
            rating: data.rating,
            comment: data.comment,
        },
        include: {
            patient: {
                select: {
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
        },
    });

    return review;
};

export const getReviews = async (doctorId: string) => {
    const reviews = await prisma.review.findMany({
        where: {
            doctorId,
            deletedAt: null,
        },
        include: {
            patient: {
                select: {
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                },
            },
            appointment: {
                select: {
                    scheduledAt: true,
                    status: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return reviews;
};
