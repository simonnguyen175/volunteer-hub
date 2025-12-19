import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const { isAuthenticated, user } = useAuth();

	// Not logged in - redirect to home
	if (!isAuthenticated || !user) {
		return <Navigate to="/" replace />;
	}

	// Check role if required
	if (requiredRole) {
		const rawRole = user.role;
		const roleName = typeof rawRole === "string" 
			? rawRole 
			: (rawRole as { name?: string } | undefined)?.name ?? "";

		if (roleName.toUpperCase() !== requiredRole.toUpperCase()) {
			// Wrong role - redirect to home
			return <Navigate to="/" replace />;
		}
	}

	return <>{children}</>;
}
