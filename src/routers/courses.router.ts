import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import type { AuthRequest } from "../lib/types";
import { roleMiddleware } from "../middleware/role.middleware";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { CreateCourseSchema, EditCourseSchema } from "../validation/schemas";
import { prisma } from "../db";
import z, { core, xid } from "zod";

const coursesRouter = Router();

coursesRouter.post("/", authMiddleware, roleMiddleware("INSTRUCTOR"), async (req: AuthRequest, res) => {
    try {
        const { data, success } = CreateCourseSchema.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "Invalid request", 400);
            return
        }

        const insertData = await prisma.course.create({
            data: {
                ...data,
                instructorId: req.userId!
            }
        });

        sendSuccessResponse(res, {
            message: "Course Created!",
            courseId: insertData.id
        }, 201);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})


coursesRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const coursesData = await prisma.course.findMany({
            include: {
                Instructor: true
            }
        });

        const response = coursesData.map(c => ({
            title: c.title,
            description: c.description,
            price: c.price,
            instructor: c.Instructor.name
        }));

        sendSuccessResponse(res, { data: response }, 200);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

coursesRouter.get("/:id", authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { data: id, success } = z.uuidv7().safeParse(courseId);
        if (!success) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }

        const coursesData = await prisma.course.findFirst({
            where: {
                id
            },
            include: {
                Instructor: true,
                Lessons: true
            }
        });

        if (!coursesData) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }

        const response = {
            title: coursesData.title,
            description: coursesData.description,
            price: coursesData.price,
            instructor: coursesData.Instructor.name,
            lessons: coursesData.Lessons.map(l => ({
                title: l.title,
                content: l.content
            }))
        };

        sendSuccessResponse(res, { data: response }, 200);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

coursesRouter.patch("/:id", authMiddleware, roleMiddleware("INSTRUCTOR"), async (req: AuthRequest, res) => {
    try {
        const courseId = req.params.id;
        const { data, success: bodySuccess } = EditCourseSchema.safeParse(req.body);
        if (!bodySuccess) {
            sendErrorResponse(res, "Invalid request", 400);
            return
        }

        const { data: id, success } = z.uuidv7().safeParse(courseId);
        if (!success) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }
        const coursesData = await prisma.course.findFirst({
            where: {
                id
            }
        });

        if (!coursesData) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }

        if (coursesData.instructorId !== req.userId) {
            sendErrorResponse(res, "You don't own the course", 403);
            return
        }

        const updateData = await prisma.course.update({
            where: { id },
            data
        });

        sendSuccessResponse(res, {
            message: "Edit Successful",
            data: {
                title: updateData.title,
                description: updateData.description,
                price: updateData.price
            }
        });
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

coursesRouter.delete("/:id", authMiddleware, roleMiddleware("INSTRUCTOR"), async (req: AuthRequest, res) => {
    try {
        const courseId = req.params.id;
        const { data: id, success } = z.uuidv7().safeParse(courseId);
        if (!success) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }
        const coursesData = await prisma.course.findFirst({
            where: {
                id
            }
        });

        if (!coursesData) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }

        if (coursesData.instructorId !== req.userId) {
            sendErrorResponse(res, "You don't own the course", 403);
            return
        }

        await prisma.course.delete({
            where: { id }
        });

        sendSuccessResponse(res, {
            message: "Course Deleted!"
        })
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

coursesRouter.get("/:courseId/lessons", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const courseId = req.params.id;
        const { data: id, success } = z.uuidv7().safeParse(courseId);
        if (!success) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }
        const coursesData = await prisma.course.findFirst({
            where: {
                id
            },
            include: {
                Lessons: true
            }
        });

        if (!coursesData) {
            sendErrorResponse(res, "Course not found", 404);
            return;
        }

        const response = coursesData.Lessons.map(l => ({
            id: l.id,
            title: l.title,
            content: l.content
        }))

        sendSuccessResponse(res, { data: response }, 200);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return
    }
})

export default coursesRouter;