import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    role: Role | string;
}

interface AuthContextType {
    username: string | null;
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    login: (username: string, token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(() => {
        return localStorage.getItem("username");
    });

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("token");
    })

    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem("isAuthenticated") === "true";
    });

    const login = (username: string, token: string, userData: User) => {
        setUsername(username);
        setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");
    };

    const logout = () => {
        setUsername(null);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ username, isAuthenticated, token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("Bro, did you forget to wrap your element around <AuthContext>???");
    }
    return context;
}
