import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
    username: string | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (username: string, token: string) => void;
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

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem("isAuthenticated") === "true";
    });

    const login = (username: string, token: string) => {
        setUsername(username);
        setToken(token);
        setIsAuthenticated(true);
        
        localStorage.setItem("username", username);
        localStorage.setItem("isAuthenticated", "true");
    };

    const logout = () => {
        setUsername(null);
        setToken(null);
        setIsAuthenticated(false);

        localStorage.clear();
    };

    return (
        <AuthContext value={{ username, isAuthenticated, token, login, logout }}>
            {children}
        </AuthContext>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("Bro, did you forget to wrap your element around <AuthContext>???");
    }
    return context;
}
