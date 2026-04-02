// src/common/types/express.d.ts
import { Role, UserStatus } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    status: UserStatus;
}