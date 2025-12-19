import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import NewsFeed from "./components/NewsFeed";
import MyEvents from "./components/MyEvents";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminEvents from "./components/admin/AdminEvents";
import AdminUsers from "./components/admin/AdminUsers";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout component includes the Header and renders child routes
const MainLayout = () => (
	<>
		<Header />
		<Outlet />
	</>
);

function App() {
	return (
		<AuthProvider>
			<ToastProvider>
				<BrowserRouter>
					<Routes>
						{/* Routes with Header */}
						<Route element={<MainLayout />}>
							<Route index element={<LandingPage />} />
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
							<Route index element={<AdminDashboard />} />
							<Route path="events" element={<AdminEvents />} />
							<Route path="users" element={<AdminUsers />} />
						</Route>
					</Routes>
				</BrowserRouter>
			</ToastProvider>
		</AuthProvider>
	);
}

export default App;
