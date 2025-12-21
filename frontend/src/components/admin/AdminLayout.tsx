import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { IconLayoutDashboard, IconCalendarEvent, IconUsers, IconLogout, IconMenu2, IconBell, IconNewSection } from "@tabler/icons-react";
import logo from "../../assets/VolunteerHub.png";
import { useAuth } from "../../contexts/AuthContext";
import { RestClient } from "../../api/RestClient";
import { onPushMessage } from "../../utils/pushNotifications";

export default function AdminLayout() {
	const [isSidebarOpen, setSidebarOpen] = useState(true);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [notifications, setNotifications] = useState<any[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const notificationRef = useRef<HTMLDivElement>(null);
	const auth = useAuth();
	const navigate = useNavigate();

	const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

	const handleLogout = () => {
		auth.logout();
		navigate("/");
	};

	// Fetch notifications
	const fetchNotifications = useCallback(async () => {
		if (!auth.user?.id) return;

		try {
			const notifResult = await RestClient.getUserNotifications(auth.user.id);

			if (notifResult.data) {
				setNotifications(notifResult.data);
				const unreadNotifications = notifResult.data.filter((n: any) => !n.read);
				setUnreadCount(unreadNotifications.length);
			}
		} catch (err) {
			console.error("Failed to fetch notifications:", err);
		}
	}, [auth.user?.id]);

	useEffect(() => {
		console.log('🔍 Admin auth state:', { 
			isAuthenticated: auth.isAuthenticated, 
			userId: auth.user?.id,
			username: auth.user?.username,
			token: localStorage.getItem('token') ? 'EXISTS' : 'MISSING'
		});
		
		if (auth.isAuthenticated && auth.user?.id) {
			fetchNotifications();
			const interval = setInterval(fetchNotifications, 30000);
			return () => clearInterval(interval);
		} else {
			console.warn('⚠️ Admin: Not fetching notifications - auth not ready', { 
				isAuthenticated: auth.isAuthenticated, 
				userId: auth.user?.id 
			});
		}
	}, [auth.isAuthenticated, auth.user?.id, fetchNotifications]);

	// Listen for push notifications from service worker
	useEffect(() => {
		if (!auth.isAuthenticated) return;

		const cleanup = onPushMessage((data) => {
			console.log('🔔 Push notification received in Admin:', data);
			fetchNotifications();
		});

		return cleanup;
	}, [auth.isAuthenticated, fetchNotifications]);

	const handleMarkAsRead = async (notificationId: number) => {
		try {
			await RestClient.markNotificationAsRead(notificationId);
			fetchNotifications();
		} catch (err) {
			console.error("Failed to mark notification as read:", err);
		}
	};

	const handleMarkAllAsRead = async () => {
		if (!auth.user?.id) return;
		
		try {
			await RestClient.markAllNotificationsAsRead(auth.user.id);
			fetchNotifications();
		} catch (err) {
			console.error("Failed to mark all notifications as read:", err);
		}
	};

	// Handler for enabling push notifications (user-initiated)
	const handleEnablePushNotifications = async () => {
		if (!auth.user?.id || !auth.token) return;
		
		try {
			const success = await setupPushNotifications(auth.user.id, auth.token);
			if (success) {
				setPushPermission('granted');
				showToast('Push notifications enabled!', 'success');
			} else {
				setPushPermission(getNotificationPermission());
				showToast('Could not enable notifications. Please check browser settings.', 'warning');
			}
		} catch (error) {
			console.error('Failed to enable push notifications:', error);
			showToast('Failed to enable notifications', 'error');
		}
	};

	// Close notification menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node)
			) {
				setIsNotificationOpen(false);
			}
		};

		if (isNotificationOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isNotificationOpen]);

	const navItems = [
		{ name: "Event Approvals", path: "/admin/events", icon: <IconCalendarEvent size={20} /> },
		{ name: "User Management", path: "/admin/users", icon: <IconUsers size={20} /> },
		{ name: "Dashboard", path: "/admin/dashboard", icon: <IconLayoutDashboard size={20} /> },
		{ name: "News Feed", path: "/admin/newsfeed", icon: <IconNewSection size={20} /> },
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
							className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
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
						{/* Notification Bell */}
						<div className="relative" ref={notificationRef}>
							<button
								onClick={() => setIsNotificationOpen(!isNotificationOpen)}
								className="p-2 text-gray-600 hover:text-[#556b2f] hover:bg-[#556b2f]/10 rounded-lg transition-all duration-300 cursor-pointer relative"
							>
								<IconBell size={24} stroke={1.5} />
								{unreadCount > 0 && (
									<span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-[#747e59] rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm font-(family-name:--font-dmsans)">
										{unreadCount > 9 ? "9+" : unreadCount}
									</span>
								)}
							</button>

							{/* Notification Dropdown */}
							{isNotificationOpen && (
								<div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[1001] max-h-96 overflow-y-auto">
									<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#556b2f]/5 to-[#747e59]/5 flex items-center justify-between">
										<h3 className="font-bold text-[#556b2f] text-base font-(family-name:--font-dmsans)">
											Notifications
										</h3>
										{unreadCount > 0 && (
											<button
												onClick={handleMarkAllAsRead}
												className="text-xs text-[#556b2f] hover:text-[#6d8c3a] font-semibold font-(family-name:--font-dmsans) hover:underline transition-colors cursor-pointer"
											>
												Mark all as read
											</button>
										)}
									</div>
									<div className="divide-y divide-gray-100">
										{/* Show enable button if permission not granted */}
										{pushPermission !== 'granted' && (
											<div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
												<p className="text-xs text-amber-700 mb-2 font-(family-name:--font-dmsans)">
													Enable push notifications to receive real-time alerts
												</p>
												<button
													onClick={handleEnablePushNotifications}
													className="w-full py-2 px-3 bg-[#556b2f] text-white text-sm font-medium rounded-lg hover:bg-[#6d8c3a] transition-colors cursor-pointer"
												>
													Enable Push Notifications
												</button>
											</div>
										)}
										{notifications.filter(notif => !notif.read).length === 0 ? (
											<div className="px-4 py-8 text-center text-gray-500 text-sm font-(family-name:--font-dmsans)">
												No new notifications...
											</div>
										) : (
											notifications
												.filter(notif => !notif.read)
												.slice(0, 10)
												.map((notif) => (
													<div
														key={notif.id}
														className={`px-4 py-3 hover:bg-[#556b2f]/5 cursor-pointer transition-colors duration-200 ${
															!notif.read
																? "bg-[#747e59]/10 border-l-4 border-[#747e59]"
																: ""
														}`}
														onClick={async () => {
															await handleMarkAsRead(notif.id);
															if (notif.link)
																navigate(notif.link);
														}}
													>
														<p 
															className="text-sm text-gray-800 font-(family-name:--font-dmsans)"
															dangerouslySetInnerHTML={{ __html: notif.content }}
														/>
														<p className="text-xs text-[#556b2f]/70 mt-1 font-(family-name:--font-dmsans)">
															{new Date(notif.createdAt).toLocaleString()}
														</p>
													</div>
												))
										)}
									</div>
								</div>
							)}
						</div>

						<div className="text-right hidden sm:block">
							<p className="text-sm font-medium text-gray-900">{auth.user?.username || "Admin User"}</p>
							<p className="text-xs text-gray-500">Administrator</p>
						</div>
						<div className="h-10 w-10 rounded-full bg-[#556b2f] text-white flex items-center justify-center font-bold text-lg">
							{(auth.user?.username || "A").charAt(0).toUpperCase()}
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
					className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-pointer"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	);
}
