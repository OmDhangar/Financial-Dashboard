// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import { RegisterDto, LoginDto } from './auth.schema';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.register(req.body as RegisterDto);
            res.status(201).json(apiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.login(req.body as LoginDto);
            res.status(200).json(apiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Stateless JWT — client drops the token.
            // If refresh tokens are added later, revoke them here.
            res.status(200).json(apiResponse.success({ message: 'Logged out successfully' }));
        } catch (error) {
            next(error);
        }
    }

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await authService.getProfile(req.user!.id);
            res.status(200).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();