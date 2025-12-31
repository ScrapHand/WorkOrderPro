import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class UserService {
    constructor(private prisma: PrismaClient) { }

    async createUser(
        tenantId: string,
        email: string,
        role: string,
        plainPassword?: string
    ): Promise<User> {
        // Default password if not provided
        const passwordToHash = plainPassword || 'temp1234';
        const passwordHash = await bcrypt.hash(passwordToHash, 10);

        return this.prisma.user.create({
            data: {
                tenantId,
                email,
                role,
                passwordHash
            }
        });
    }

    async getAllUsers(tenantId: string): Promise<User[]> {
        return this.prisma.user.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            // Exclude passwordHash in a real mapper, checking if controller does it
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });
    }
}
