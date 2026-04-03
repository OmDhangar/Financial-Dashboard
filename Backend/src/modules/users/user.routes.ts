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
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(listUsersSchema), (req, res, next) =>
    userController.list(req, res, next),
);

router.get('/:id', validate(userIdParamSchema), (req, res, next) =>
    userController.getById(req, res, next),
);

router.post('/', validate(createUserSchema), (req, res, next) =>
    userController.create(req, res, next),
);

router.patch('/:id', validate(updateUserSchema), (req, res, next) =>
    userController.update(req, res, next),
);

router.patch('/:id/role', validate(updateUserRoleSchema), (req, res, next) =>
    userController.updateRole(req, res, next),
);

router.patch('/:id/status', validate(updateUserStatusSchema), (req, res, next) =>
    userController.updateStatus(req, res, next),
);

router.delete('/:id', validate(userIdParamSchema), (req, res, next) =>
    userController.delete(req, res, next),
);

export default router;