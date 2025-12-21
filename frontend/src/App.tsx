import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import NewsFeed from "./components/NewsFeed";
import MyEvents from "./components/MyEvents";
import Dashboard from "./components/Dashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminEvents from "./components/admin/AdminEvents";
import AdminUsers from "./components/admin/AdminUsers";
import ProtectedRoute from "./components/ProtectedRoute";
import LockedAccountModal from "./components/ui/LockedAccountModal";

// Layout component includes the Header and renders child routes
const MainLayout = () => (
	<>
		<Header />
		<Outlet />
	</>
);

// Wrapper to handle locked account modal at app level
function AppContent() {
	const { showLockedModal, setShowLockedModal } = useAuth();
	
	return (
		<>
			<BrowserRouter>
				<Routes>
					{/* Routes with Header */}
					<Route element={<MainLayout />}>
						<Route index element={<LandingPage />} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/events" element={<Events />} />
						<Route path="/events/:eventId" element={<EventDetails />} />
						<Route path="/newsfeed" element={<NewsFeed />} />
						<Route path="/my-events" element={<MyEvents />} />
					</Route>
					
					{/* Admin Routes - Protected, requires ADMIN role */}
					<Route path="/admin" element={
						<ProtectedRoute requiredRole="ADMIN">
							<AdminLayout />
						</ProtectedRoute>
					}>
						<Route index element={<AdminEvents />} />
						<Route path="events" element={<AdminEvents />} />
						<Route path="users" element={<AdminUsers />} />
						<Route path="dashboard" element={<AdminDashboard />} />
					</Route>
				</Routes>
			</BrowserRouter>
			
			{/* Global Locked Account Modal */}
			<LockedAccountModal 
				isOpen={showLockedModal} 
				onClose={() => setShowLockedModal(false)} 
			/>
		</>
	);
}

function App() {
	return (
		<AuthProvider>
			<ToastProvider>
				<AppContent />
			</ToastProvider>
		</AuthProvider>
	);
}

export default App;
