import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminLogin from "./admin/AdminLogin";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const { isAuthenticated, user } = useAuth();

	// For admin routes, show the admin login page if not authenticated or wrong role
	if (requiredRole?.toUpperCase() === "ADMIN") {
		// Not logged in - show admin login page
		if (!isAuthenticated || !user) {
			return <AdminLogin />;
		}
		
		// Check role
		const rawRole = user.role;
		const roleName = typeof rawRole === "string" 
			? rawRole 
			: (rawRole as { name?: string } | undefined)?.name ?? "";

		if (roleName.toUpperCase() !== "ADMIN") {
			// Wrong role - show admin login page
			return <AdminLogin />;
		}
		
		return <>{children}</>;
	}

	// For non-admin protected routes
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
			return <Navigate to="/" replace />;
		}
	}

	return <>{children}</>;
}
