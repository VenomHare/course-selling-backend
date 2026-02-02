import { request, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import type { AuthRequest } from "../lib/types";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { CreateLessonSchema } from "../validation/schemas";
import { prisma } from "../db";

const lessonsRouter = Router();

lessonsRouter.post("/", authMiddleware, roleMiddleware("INSTRUCTOR"), async (req: AuthRequest, res) => {
    try {
        const { data, success } = CreateLessonSchema.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "Invalid request", 400);
            return
        }

        const courseData = await prisma.course.findFirst({ where: { id: data.courseId } });
        if (!courseData) {
            sendErrorResponse(res, "Course Not Found", 404);
            return
        }

        if (courseData.instructorId !== req.userId) {
            sendErrorResponse(res, "You are not the Instructor of course", 403);
            return;
        }

        const insertData = await prisma.lesson.create({
            data
        });

        sendSuccessResponse(res, { message: "Lesson Created", id: insertData.id }, 200);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

export default lessonsRouter