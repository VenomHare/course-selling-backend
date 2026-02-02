import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { PurchaseCourseSchema } from "../validation/schemas";
import { prisma } from "../db";
import type { AuthRequest } from "../lib/types";
import z from "zod";

const purchaseRouter = Router();

purchaseRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userData = await prisma.user.findFirst({
            where: {
                id: req.userId
            }
        });
        if (!userData) {
            sendErrorResponse(res, "Unauthorized", 401);
            return
        }
        sendSuccessResponse(res, {
            id: userData.id,
            email: userData.email,
            name: userData.name
        });
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return 
    }
})

purchaseRouter.post("/purchases", authMiddleware, roleMiddleware("STUDENT"), async (req: AuthRequest, res) => {
    try {
        const { data, success } = PurchaseCourseSchema.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "Invalid request", 400);
            return
        }


        await prisma.$transaction(async (tx) => {

            const courseData = await tx.course.findFirst({ where: { id: data.courseId } });
            if (!courseData) {
                sendErrorResponse(res, "Course Not Found", 404);
                throw new Error("Course Data not found");
            }
            await tx.$queryRaw`SELECT * FROM "Course" WHERE "id" = ${data.courseId} FOR UPDATE`;

            const userPurchases = await tx.purchase.findMany({ where: { userId: req.userId } });
            userPurchases.map(p => {
                if (p.courseId == data.courseId) {
                    sendErrorResponse(res, "Already Purchased Course", 400);
                    throw new Error("Already Purchased Course");
                }
            });

            await tx.purchase.create({
                data: {
                    courseId: data.courseId,
                    userId: req.userId!
                }
            });

            sendSuccessResponse(res, { message: "Purchase successful" }, 200);
            return
        });
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong");
    }
})


purchaseRouter.get("/users/:id/purchases", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.params.id as string;
        
        if (req.role == "STUDENT" && req.userId !== userId) {
            sendErrorResponse(res, "Forbidden", 403);
            return
        }

        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                Purchases: {
                    include: {
                        Course: true
                    }
                }
            }
        })

        if (!userData) {
            sendErrorResponse(res, "User not found", 404);
            return;
        }

        const response = userData.Purchases.map(p => ({
            course: {
                id: p.courseId,
                title: p.Course.title,
                description: p.Course.description
            }
        }))
        console.log(response);
        sendSuccessResponse(res, response, 200);
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong");
    }
})
export default purchaseRouter;