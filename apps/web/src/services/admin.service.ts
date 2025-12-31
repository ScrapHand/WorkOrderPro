import { api } from "@/lib/api";
import { User, UserRole } from "@/lib/auth/types";

export interface CreateUserDTO {
    email: string;
    role: UserRole;
    password?: string;
}

export interface BrandingDTO {
    logoUrl?: string;
    brandColor?: string;
}

export const AdminService = {
    getUsers: async (): Promise<User[]> => {
        const res = await api.get("/users");
        return res.data;
    },

    createUser: async (data: CreateUserDTO): Promise<User> => {
        const res = await api.post("/users", data);
        return res.data;
    },

    updateBranding: async (data: BrandingDTO): Promise<any> => {
        const res = await api.patch("/tenant/branding", data);
        return res.data;
    }
};
