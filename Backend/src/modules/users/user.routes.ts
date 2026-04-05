// src/modules/users/user.routes.ts
import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorization';
import { validate } from '../../middleware/validate';
import {
    createUserSchema,
    updateUserSchema,
    updateUserRoleSchema,
    updateUserStatusSchema,
    userIdParamSchema,
    listUsersSchema,
} from './user.schema';

const router = Router();

// All user routes require authentication + ADMIN role
router.use(authenticate);

router.get('/', authorize('ADMIN', 'ANALYST'), validate(listUsersSchema), (req, res, next) =>
    userController.list(req, res, next),
);

router.get('/:id', authorize('ADMIN', 'ANALYST'), validate(userIdParamSchema), (req, res, next) =>
    userController.getById(req, res, next),
);

router.post('/', authorize('ADMIN'), validate(createUserSchema), (req, res, next) =>
    userController.create(req, res, next),
);

router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), (req, res, next) =>
    userController.update(req, res, next),
);

router.patch('/:id/role', authorize('ADMIN'), validate(updateUserRoleSchema), (req, res, next) =>
    userController.updateRole(req, res, next),
);

router.patch('/:id/status', authorize('ADMIN'), validate(updateUserStatusSchema), (req, res, next) =>
    userController.updateStatus(req, res, next),
);

router.delete('/:id', authorize('ADMIN'), validate(userIdParamSchema), (req, res, next) =>
    userController.delete(req, res, next),
);

export default router;