import { api } from "@/lib/api";

export interface User {
    id: string;
    email: string;
    username: string | null;
    role: string;
    createdAt: string;
}

export const UserService = {
    getAll: async (): Promise<User[]> => {
        const { data } = await api.get<User[]>("/users");
        return data;
    }
};
