import { api } from "@/lib/api";
import { User } from "@/lib/auth/types";

export const UserService = {
    getAll: async (): Promise<User[]> => {
        const { data } = await api.get<User[]>("/users");
        return data;
    }
};
