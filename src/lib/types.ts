import type { Request } from "express";
import type { UserRole } from "../generated/prisma/enums";

export interface AuthRequest extends Request {
    userId?: string,
    role?: UserRole
}