import { Router } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../lib/response";
import { LoginSchema, SignupSchema } from "../validation/schemas";
import { prisma } from "../db";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
    try {
        const { data, success } = SignupSchema.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "Invalid request", 400);
            return 
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email
            }
        })
        if (existingUser) {
            sendErrorResponse(res, "User Already Exists", 400);
            return;
        }

        const hashedPassword = bcrypt.hashSync(data.password, 10);

        const insertData = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        });

        sendSuccessResponse(res, {
            message: "User Created Successfully!"
        });
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return 
    }
})

authRouter.post("/login", async (req, res) => {
    try {
        const { data, success } = LoginSchema.safeParse(req.body);
        if (!success) {
            sendErrorResponse(res, "Invalid request", 400);
            return 
        }

        const userData = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        })
        if (!userData) {
            sendErrorResponse(res, "User Not Found", 404);
            return;
        }

        const isPasswordCorrect = bcrypt.compareSync(data.password, userData.password);
        if (!isPasswordCorrect) {
            sendErrorResponse(res, "Invalid Credentials", 400);
        }
        const JWT_SECRET = process.env.JWT_SECRET!;
        const token = jwt.sign({
            id: userData.id,
            role: userData.role
        }, JWT_SECRET);

        sendSuccessResponse(res, {
            message: "Login Successful",
            token
        }, 200);
        return;
    }
    catch (err) {
        console.log(err);
        sendErrorResponse(res, "Something went wrong!");
        return 
    }
})
export default authRouter