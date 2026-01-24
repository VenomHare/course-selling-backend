import type { NextFunction, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { sendErrorResponse } from "../lib/response";
import type { AuthRequest } from "../lib/types";
import type { UserRole } from "../generated/prisma/enums";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: string,
    role: UserRole
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            sendErrorResponse(res, "Authorization token not found", 401);
            return;
        }
        const token = authHeader.split(" ")[0];
        if (!token) {
            sendErrorResponse(res, "Invalid Token", 401);
            return;
        }
        const JWT_SECRET = process.env.JWT_SECRET!;
        const data = jwt.verify(token, JWT_SECRET) as JwtPayload;

        req.userId = data.id;
        req.role = data.role;
        next();
    }
    catch (err) {
        if (!(err instanceof JsonWebTokenError)) {
            console.log(err);
        }
        sendErrorResponse(res, "Unauthorized", 401);
    }
}