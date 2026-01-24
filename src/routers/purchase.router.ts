import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { PurchaseCourseSchema } from "../validation/schemas";
import { prisma } from "../db";
import type { AuthRequest } from "../lib/types";
import z from "zod";

const purchaseRouter = Router();

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
            await tx.$queryRaw`SELECT * FROM course WHERE "id" = ${data.courseId} FOR UPDATE`;

            const userPurchases = await tx.purchase.findMany({ where: { userId: req.userId } });
            userPurchases.map(p => {
                if (p.courseId == data.courseId) {
                    sendErrorResponse(res, "Already Purchased Course", 400);
                    throw new Error("Already Purchased Course");
                }
            });

            const purchaseData = await tx.purchase.create({
                data: {
                    courseId: data.courseId,
                    userId: req.userId!
                }
            });

            sendSuccessResponse(res, { message: "Purchase successful" }, 201);
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
        const userId = req.params.id;
        const { data, success } = z.uuidv7().safeParse(userId);
        if (!success) {
            sendErrorResponse(res, "User not found", 404);
            return;
        }

        const userData = await prisma.user.findUnique({
            where: { id: data },
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
            courseId: p.courseId,
            title: p.Course.title,
            description: p.Course.description
        }))

        sendSuccessResponse(res, {
            data: response
        }, 200);
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong");
    }
})
export default purchaseRouter;