import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../../src/services/JWTService";

declare global {
    namespace Express {
        export interface Request {
            userId?: string;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const jwtString = req.headers.token as string;
    if (!jwtString) {
        res.sendStatus(401);
        return;
    }
    try {
        const result = verifyJWT(jwtString);
        req.userId = result.id;
        next();
    } catch (e) {
        res.sendStatus(401);
        return;
    }
}