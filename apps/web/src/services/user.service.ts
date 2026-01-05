import { api } from "@/lib/api";
import { User } from "@/lib/auth/types";

export const UserService = {
    getAll: async (): Promise<User[]> => {
        const { data } = await api.get<User[]>("/users");
        return data;
    },

    update: async (id: string, data: Partial<User>): Promise<User> => {
        const { data: updatedUser } = await api.patch<User>(`/users/${id}`, data);
        return updatedUser;
    }
};
