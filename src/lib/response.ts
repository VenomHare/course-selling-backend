import type { Response } from "express"

export const sendErrorResponse = (res: Response, message: string, code?: number) => {
    res.status(code ?? 500).json({
        "error": message,
        "statusCode": code ?? 500,
        "timestamp": new Date().toISOString()
    })
    return 
}

export const sendSuccessResponse = (res: Response, data: object, code?: number) => {
    res.status(code ?? 200).json(data);
    return 
}
