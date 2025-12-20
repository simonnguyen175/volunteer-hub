import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { IconLayoutDashboard, IconCalendarEvent, IconUsers, IconLogout, IconMenu2 } from "@tabler/icons-react";
import logo from "../../assets/VolunteerHub.png";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout() {
	const [isSidebarOpen, setSidebarOpen] = useState(true);
	const auth = useAuth();
	const navigate = useNavigate();

	const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

	const handleLogout = () => {
		auth.logout();
		navigate("/");
	};

	const navItems = [
		{ name: "Event Approvals", path: "/admin/events", icon: <IconCalendarEvent size={20} /> },
		{ name: "User Management", path: "/admin/users", icon: <IconUsers size={20} /> },
		{ name: "News Feed", path: "/admin/dashboard", icon: <IconLayoutDashboard size={20} /> },
	];

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden font-(family-name:--font-dmsans)">
			{/* Sidebar */}
			<aside 
				className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:w-20"
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Sidebar Header */}
					<div className="flex items-center justify-center h-20 border-b border-gray-100">
						<Link to="/" className="flex items-center gap-2">
							<img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
						</Link>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
						{navItems.map((item) => (
							<NavLink
								key={item.path}
								to={item.path}
								className={({ isActive }) =>
									`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
										isActive
											? "bg-[#556b2f] text-white shadow-md"
											: "text-gray-600 hover:bg-gray-100"
									}`
								}
							>
								<span className="flex-shrink-0">{item.icon}</span>
								<span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
									{item.name}
								</span>
								
								{/* Tooltip for collapsed state */}
								{!isSidebarOpen && (
									<div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none hidden lg:block">
										{item.name}
									</div>
								)}
							</NavLink>
						))}
					</nav>

					{/* Sidebar Footer */}
					<div className="p-4 border-t border-gray-100">
						<button
							onClick={handleLogout}
							className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
						>
							<IconLogout size={20} />
							<span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
								Log out
							</span>
						</button>
					</div>
				</div>
			</aside>

			{/* Main Content Wrapper */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Top Header */}
				<header className="bg-white border-b border-gray-200 h-20 px-8 flex items-center justify-between">
					<button
						onClick={toggleSidebar}
						className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
					>
						<IconMenu2 size={24} />
					</button>

					<div className="flex items-center gap-4 ml-auto">
						<div className="text-right hidden sm:block">
							<p className="text-sm font-medium text-gray-900">Admin User</p>
							<p className="text-xs text-gray-500">Administrator</p>
						</div>
						<div className="h-10 w-10 rounded-full bg-[#556b2f] text-white flex items-center justify-center font-bold text-lg">
							A
						</div>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-auto p-4 md:p-8">
					<Outlet />
				</main>
			</div>

			{/* Mobile Overlay */}
			{isSidebarOpen && (
				<div 
					className="fixed inset-0 bg-black/50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	);
}
