import { Request, Response } from "express";
import { TokenService } from "../utils/tokenService";
export declare function createAuthController(tokenService: TokenService): {
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
    refresh: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=authController.d.ts.map