import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import NewsFeed from "./components/NewsFeed";
import Register from "./components/Register";
import { AuthProvider } from "./contexts/AuthContext";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminEvents from "./components/admin/AdminEvents";
import AdminUsers from "./components/admin/AdminUsers";

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
			<BrowserRouter>
				<Routes>
					{/* Routes with Header */}
					<Route element={<MainLayout />}>
						<Route index element={<LandingPage />} />
						<Route path="/events" element={<Events />} />
						<Route path="/events/:eventId" element={<EventDetails />} />
						<Route path="/newsfeed" element={<NewsFeed />} />
					</Route>

					{/* Routes without Header */}
					<Route path="/register" element={<Register />} />
					
					{/* Admin Routes */}
					<Route path="/admin" element={<AdminLayout />}>
						<Route index element={<AdminDashboard />} />
						<Route path="events" element={<AdminEvents />} />
						<Route path="users" element={<AdminUsers />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
