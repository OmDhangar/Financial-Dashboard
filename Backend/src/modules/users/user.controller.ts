// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto,
    ListUsersQuery,
} from './user.schema';

export class UserController {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as ListUsersQuery;
            const { users, total } = await userService.listUsers(query);
            res
                .status(200)
                .json(apiResponse.paginated(users, Number(query.page), Number(query.limit), total));
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.getUserById(req.params.id);
            res.status(200).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.createUser(req.body as CreateUserDto);
            res.status(201).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.updateUser(req.params.id, req.body as UpdateUserDto);
            res.status(200).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.updateUserRole(
                req.params.id,
                req.body as UpdateUserRoleDto,
                req.user!.id,
            );
            res.status(200).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.updateUserStatus(
                req.params.id,
                req.body as UpdateUserStatusDto,
                req.user!.id,
            );
            res.status(200).json(apiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await userService.deleteUser(req.params.id, req.user!.id);
            res.status(200).json(apiResponse.success({ message: 'User deleted successfully' }));
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();