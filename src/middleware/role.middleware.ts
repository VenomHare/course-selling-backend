import type { NextFunction, Response } from "express";
import type { UserRole } from "../generated/prisma/enums";
import type { AuthRequest } from "../lib/types";
import { sendErrorResponse } from "../lib/response";

export const roleMiddleware = (role: UserRole) => {
    return (req: AuthRequest, res: Response, next: NextFunction ) => {
        if (!req.role || req.role !== role) {
            sendErrorResponse(res, "Forbidden", 403);
            return;
        }
        next();
    }
}