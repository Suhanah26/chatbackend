import type { IUser } from "../src/model/userModel.js";
import type { NextFunction } from "express-serve-static-core";
import type { Request, Response } from "express";
export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}
export declare const isAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=isAuth.d.ts.map