import {
	IconArrowUpRight,
	IconBell,
	IconMenu2,
	IconX,
	IconCalendarEvent,
	IconLogout,
	IconChevronDown,
} from "@tabler/icons-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useSearchParams, useNavigate } from "react-router-dom";
import { RestClient } from "../api/RestClient";
import { onPushMessage, setupPushNotifications, getNotificationPermission } from "../utils/pushNotifications";

import logo from "../assets/VolunteerHub.png";
import Login from "./Login";
import Register from "./Register";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/Toast";

export default function Header() {
	const [isLoginOpen, setLoginOpen] = useState(false);
	const [isRegisterOpen, setRegisterOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [notifications, setNotifications] = useState<any[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const auth = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const userMenuRef = useRef<HTMLDivElement>(null);
	const notificationRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			return Notification.permission;
		}
		return 'default';
	});

	const rawRole = auth.user?.role;
	const roleName = typeof rawRole === "string" ? rawRole : (rawRole as { name?: string; role?: string } | undefined)?.name ?? "";
	const greetingLabel = roleName === "USER" ? "user" : roleName === "HOST" ? "host" : roleName === "ADMIN" ? "admin" : "user";

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);

		// Check for login query param
		if (searchParams.get("login") === "true") {
			setLoginOpen(true);
			// Optional: Remove the query param to clean up URL
			setSearchParams(
				(prev) => {
					const newParams = new URLSearchParams(prev);
					newParams.delete("login");
					return newParams;
				},
				{ replace: true },
			);
		}

		// Check for register query param
		if (searchParams.get("register") === "true") {
			setRegisterOpen(true);
			setSearchParams(
				(prev) => {
					const newParams = new URLSearchParams(prev);
					newParams.delete("register");
					return newParams;
				},
				{ replace: true },
			);
		}

		return () => window.removeEventListener("scroll", handleScroll);
	}, [searchParams, setSearchParams]);

	// Disable body scroll when modal is open
	useEffect(() => {
		if (isLoginOpen || isRegisterOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isLoginOpen, isRegisterOpen]);

	// Close user menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				userMenuRef.current &&
				!userMenuRef.current.contains(event.target as Node)
			) {
				setIsUserMenuOpen(false);
			}
		};

		if (isUserMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
	});

	// Fetch notifications
	const fetchNotifications = useCallback(async () => {
		if (!auth.user?.id) return;

		try {
			const notifResult = await RestClient.getUserNotifications(auth.user.id);

			if (notifResult.data) {
				setNotifications(notifResult.data);
				// Count unread notifications manually
				const unreadNotifications = notifResult.data.filter((n: any) => !n.read);
				setUnreadCount(unreadNotifications.length);
			}
		} catch (err) {
			console.error("Failed to fetch notifications:", err);
		}
	}, [auth.user?.id]);

	useEffect(() => {
		if (auth.isAuthenticated && auth.user?.id) {
			fetchNotifications();
			// Poll for new notifications every 30 seconds
			const interval = setInterval(fetchNotifications, 30000);
			return () => clearInterval(interval);
		}
	}, [auth.isAuthenticated, auth.user?.id, fetchNotifications]);

	// Listen for push notifications from service worker
	useEffect(() => {
		if (!auth.isAuthenticated) return;

		const cleanup = onPushMessage((data) => {
			console.log('🔔 Push notification received in Header:', data);
			// Show toast notification
			const strippedBody = data.body?.replace(/<[^>]*>/g, '') || 'New notification';
			showToast(strippedBody, "info");
			// Immediately refresh notifications when a push is received
			fetchNotifications();
		});

		return cleanup;
	}, [auth.isAuthenticated, fetchNotifications, showToast]);

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

	const handleMarkAsRead = async (notificationId: number) => {
		try {
			await RestClient.markNotificationAsRead(notificationId);
			fetchNotifications();
		} catch (err) {
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

	const navLinks = [
		{ name: "Home", path: "/" },
		{ name: "Events", path: "/events" },
		{ name: "News Feed", path: "/newsfeed" },
		{ name: "Dashboard", path: "/dashboard" },
	];

	// Get current path to highlight active link
	const currentPath = window.location.pathname;

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-[999] px-4 md:px-10 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled || isMobileMenuOpen ? "backdrop-blur-md bg-white/60 shadow-sm" : "bg-transparent"}`}
			>
				{/* VolunteerHub logo */}
				<NavLink to="/" className="flex items-center cursor-pointer">
					<img
						className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
						src={logo}
						alt="VolunteerHub Logo"
					/>
				</NavLink>

				{/* Navigation Links - Centered & Clean */}
				<nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-10">
					{navLinks.map((link) => {
						const isActive = currentPath === link.path || (link.path !== "/" && currentPath.startsWith(link.path));
						return (
							<a
								key={link.path}
								href={link.path}
								className={`relative text-base font-bold transition-colors duration-300 ${
									isActive 
										? "text-[#556b2f]" 
										: "text-gray-600 hover:text-[#556b2f]"
								} after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#556b2f] after:transition-all after:duration-300 hover:after:w-full`}
							>
								{link.name}
							</a>
						);
					})}
				</nav>

				{/* Sign in button & Notification */}
				<div className="flex items-center gap-4">
					{auth.isAuthenticated && (
						<div className="relative" ref={notificationRef}>
							<button
								onClick={() =>
									setIsNotificationOpen(!isNotificationOpen)
								}
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
														await handleMarkAsRead(
																notif.id,
															);
														if (notif.link)
															window.location.href =
																notif.link;
														}}
													>
														<p 
															className="text-sm text-gray-800 font-(family-name:--font-dmsans)"
															dangerouslySetInnerHTML={{ __html: notif.content }}
														/>
														<p className="text-xs text-[#556b2f]/70 mt-1 font-(family-name:--font-dmsans)">
															{new Date(
																notif.createdAt,
															).toLocaleString()}
														</p>
													</div>
												))
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{auth.isAuthenticated ? (
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() =>
									setIsUserMenuOpen(!isUserMenuOpen)
								}
								className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
							>
									<span className="font-(family-name:--font-crimson) text-xl">
										Hello,
									</span>
									<span className="font-(family-name:--font-crimson) text-lime-800 font-bold text-xl capitalize">
										{greetingLabel} {auth.user?.username ?? auth.username}
									</span>
								<IconChevronDown
									size={20}
									className={`text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
								/>
							</button>

							{/* Dropdown Menu */}
							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[1001]">
									<button
										onClick={() => {
											setIsUserMenuOpen(false);
											navigate("/my-events");
										}}
										className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-gray-700 cursor-pointer"
									>
										<IconCalendarEvent
											size={20}
											className="text-[#556b2f]"
										/>
										<span className="font-medium">
											My Events
										</span>
									</button>



									<div className="border-t border-gray-200 my-2"></div>

									<button
										onClick={() => {
											auth.logout();
											setIsUserMenuOpen(false);
										}}
										className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left text-red-600 cursor-pointer"
									>
										<IconLogout size={20} />
										<span className="font-medium">
											Logout
										</span>
									</button>
								</div>
							)}
						</div>
					) : (
						<button
							className="hidden md:flex font-(family-name:--font-dmsans) bg-[#556b2f] text-white text-base cursor-pointer transition-all duration-300 ease-[ease] px-6 py-2 rounded-full border-none hover:bg-[#8e9c78] group items-center gap-2 shadow-md hover:shadow-lg"
							onClick={() => {
								setLoginOpen(true);
							}}
						>
							Login
							<IconArrowUpRight
								className="group-hover:-translate-y-1 transition-transform duration-300 ease-[ease]"
								size={16}
							/>
						</button>
					)}
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden p-2 text-gray-600 hover:text-[#556b2f] transition-colors"
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				>
					{isMobileMenuOpen ? (
						<IconX size={28} />
					) : (
						<IconMenu2 size={28} />
					)}
				</button>
			</header>

			{/* Mobile Menu Backdrop & Container */}
			<div
				className={`fixed inset-0 z-[999] md:hidden transition-all duration-300 ${isMobileMenuOpen ? "visible" : "invisible"}`}
			>
				{/* Backdrop */}
				<div
					className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 cursor-pointer ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
					onClick={() => setIsMobileMenuOpen(false)}
				/>

				{/* Sliding Menu (Right Side, 3/4 Width) */}
				<div
					className={`absolute top-0 right-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
				>
					<div className="flex flex-col h-full">
						{/* Mobile Menu Header */}
						<div className="flex justify-between items-center p-4 border-b border-gray-100">
							<NavLink
								to="/"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								<img
									src={logo}
									alt="VolunteerHub Logo"
									className="h-10 w-auto object-contain"
								/>
							</NavLink>
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								className="p-2 text-gray-500 hover:text-gray-700"
							>
								<IconX size={24} />
							</button>
						</div>

						{/* Mobile Menu Links */}
						<nav className="flex flex-col p-4 gap-2">
							{navLinks.map((link) => {
								const isActive = currentPath === link.path || (link.path !== "/" && currentPath.startsWith(link.path));
								return (
									<a
										key={link.path}
										href={link.path}
										className={`text-lg font-medium px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between group ${
											isActive
												? "bg-blue-50 text-[#556b2f] font-bold"
												: "text-gray-600 hover:bg-gray-50 hover:text-[#556b2f]"
										}`}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										{link.name}
									</a>
								);
							})}
						</nav>

						{/* Mobile Menu Footer (Login) */}
						<div className="mt-auto p-4 border-t border-gray-100 mb-8">
							{!auth.isAuthenticated && (
								<button
									className="w-full font-(family-name:--font-dmsans) bg-[#556b2f] text-white text-lg font-semibold cursor-pointer transition-all duration-300 ease-[ease] py-3 rounded-xl border-none shadow-md hover:shadow-lg hover:bg-[#8e9c78] flex items-center justify-center gap-2"
									onClick={() => {
										setLoginOpen(true);
										setIsMobileMenuOpen(false);
									}}
								>
									Login
									<IconArrowUpRight size={20} />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{isLoginOpen && <Login setLoginOpen={setLoginOpen} />}
			{isRegisterOpen && <Register setRegisterOpen={setRegisterOpen} />}
		</>
	);
}
