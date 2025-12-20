import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { setupPushNotifications, unsubscribeFromPush, registerServiceWorker } from "../utils/pushNotifications";

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

    const login = async (username: string, token: string, userData: User) => {
        setUsername(username);
        setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");

        // Setup push notifications after login
        try {
            const pushSetup = await setupPushNotifications(userData.id, token);
            if (pushSetup) {
                console.log('✅ Push notifications enabled');
            } else {
                console.log('ℹ️ Push notifications not enabled (permission denied or not supported)');
            }
        } catch (error) {
            console.error('Failed to setup push notifications:', error);
        }
    };

    const logout = async () => {
        // Unsubscribe from push notifications
        try {
            await unsubscribeFromPush();
        } catch (error) {
            console.error('Failed to unsubscribe from push:', error);
        }

        setUsername(null);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        // Clear storage and force a full page reload so the app resets (like F5)
        localStorage.clear();
        // Use reload to ensure all in-memory state (context, caches) is reset
        window.location.reload();
    };

    // Register service worker on mount (for existing sessions)
    useEffect(() => {
        registerServiceWorker();
        
        // If user is already logged in, setup push notifications
        if (isAuthenticated && user?.id && token) {
            setupPushNotifications(user.id, token).catch(console.error);
        }
    }, []);

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
