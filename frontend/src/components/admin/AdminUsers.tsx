import { useState, useEffect } from "react";
import { IconLock, IconLockOpen, IconTrash, IconSearch, IconDownload, IconChevronDown, IconUser, IconUsers, IconUserCheck, IconMail, IconShieldCheck } from "@tabler/icons-react";
import { RestClient } from "@/api/RestClient";
import { useToast } from "@/components/ui/Toast";

interface Role {
	id: number;
	name: string;
}

interface User {
	id: number;
	username: string;
	email: string;
	role: Role;
	locked: boolean;
}

export default function AdminUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [showExportMenu, setShowExportMenu] = useState(false);
	const { showToast } = useToast();

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			console.log("Fetching all users...");
			const result = await RestClient.getAllUsers();
			console.log("Users result:", result);
			if (result.data) {
				// Filter out admin accounts - only show USER and HOST
				const nonAdminUsers = result.data.filter((user: User) => {
					const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
					return roleName?.toUpperCase() !== 'ADMIN';
				}).sort((a: User, b: User) => a.username.localeCompare(b.username));
				setUsers(nonAdminUsers);
			} else {
				console.error("No data in result:", result);
				showToast(result.message || "Failed to load users", "error");
			}
		} catch (err) {
			console.error("Failed to fetch users:", err);
			showToast("Failed to load users. Please check console.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			fetchUsers();
			return;
		}
		
		try {
			const result = await RestClient.searchUsers(searchQuery);
			if (result.data) {
				const allResults = Array.isArray(result.data) ? result.data : [result.data];
				// Filter out admin accounts from search results too
				const nonAdminUsers = allResults.filter((user: User) => {
					const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
					return roleName?.toUpperCase() !== 'ADMIN';
				}).sort((a: User, b: User) => a.username.localeCompare(b.username));
				setUsers(nonAdminUsers);
			}
		} catch (err) {
			console.error("Failed to search users:", err);
		}
	};

	const handleToggleLock = async (id: number) => {
		try {
			await RestClient.toggleUserLock(id);
			showToast("User lock status updated", "success");
			// Refresh users list
			fetchUsers();
		} catch (err) {
			console.error("Failed to toggle user lock:", err);
			showToast("Failed to update user status", "error");
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this user?")) return;
		
		try {
			await RestClient.deleteUser(id);
			showToast("User deleted successfully", "success");
			// Refresh users list
			fetchUsers();
		} catch (err) {
			console.error("Failed to delete user:", err);
			showToast("Failed to delete user", "error");
		}
	};

	const handleHostToggle = async (user: User) => {
		const isCurrentlyHost = getRoleName(user.role).toUpperCase() === 'HOST';
		const newRole = isCurrentlyHost ? 'USER' : 'HOST';
		
		try {
			await RestClient.updateUserRole(user.id, newRole);
			showToast(`User role updated to ${newRole}`, "success");
			// Refresh users list
			fetchUsers();
		} catch (err) {
			console.error("Failed to update user role:", err);
			showToast("Failed to update user role", "error");
		}
	};

	// Helper to get role name from role object or string
	const getRoleName = (role: Role | string): string => {
		if (typeof role === 'string') return role;
		return role?.name || 'USER';
	};

	// Stats calculations
	const totalUsers = users.length;
	const hostCount = users.filter(u => getRoleName(u.role).toUpperCase() === 'HOST').length;
	const activeCount = users.filter(u => !u.locked).length;

	// Export helper functions
	const downloadFile = (content: string, filename: string, mimeType: string) => {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const exportToCSV = () => {
		const headers = ['ID', 'Username', 'Email', 'Role', 'Status'];
		const rows = users.map(user => [
			user.id,
			user.username,
			user.email,
			getRoleName(user.role),
			user.locked ? 'Locked' : 'Active'
		]);
		const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
		downloadFile(csvContent, `users_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
		showToast("Users exported to CSV", "success");
		setShowExportMenu(false);
	};

	const exportToTSV = () => {
		const headers = ['ID', 'Username', 'Email', 'Role', 'Status'];
		const rows = users.map(user => [
			user.id,
			user.username,
			user.email,
			getRoleName(user.role),
			user.locked ? 'Locked' : 'Active'
		]);
		const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
		downloadFile(tsvContent, `users_export_${new Date().toISOString().split('T')[0]}.tsv`, 'text/tab-separated-values');
		showToast("Users exported to TSV", "success");
		setShowExportMenu(false);
	};

	const exportToJSON = () => {
		const exportData = users.map(user => ({
			id: user.id,
			username: user.username,
			email: user.email,
			role: getRoleName(user.role),
			status: user.locked ? 'Locked' : 'Active'
		}));
		const jsonContent = JSON.stringify(exportData, null, 2);
		downloadFile(jsonContent, `users_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		showToast("Users exported to JSON", "success");
		setShowExportMenu(false);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
					<p className="text-gray-500 font-medium">Loading users...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-3xl font-bold text-gray-800 font-(family-name:--font-crimson)">
						User Management
					</h1>
					<p className="text-gray-500 mt-1">Manage user accounts and permissions.</p>
				</div>
				
				{/* Stats and Export */}
				<div className="flex items-center gap-4">
					<div className="bg-gradient-to-br from-blue-50 to-blue-100 px-5 py-3 rounded-xl border border-blue-200 transition-transform duration-300 hover:scale-105">
						<div className="flex items-center gap-2">
							<IconUsers size={18} className="text-blue-600" />
							<div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
						</div>
						<div className="text-xs text-blue-600 font-medium">Total Users</div>
					</div>
					<div className="bg-gradient-to-br from-purple-50 to-purple-100 px-5 py-3 rounded-xl border border-purple-200 transition-transform duration-300 hover:scale-105">
						<div className="flex items-center gap-2">
							<IconShieldCheck size={18} className="text-purple-600" />
							<div className="text-2xl font-bold text-purple-700">{hostCount}</div>
						</div>
						<div className="text-xs text-purple-600 font-medium">Hosts</div>
					</div>
					<div className="bg-gradient-to-br from-emerald-50 to-emerald-100 px-5 py-3 rounded-xl border border-emerald-200 transition-transform duration-300 hover:scale-105">
						<div className="flex items-center gap-2">
							<IconUserCheck size={18} className="text-emerald-600" />
							<div className="text-2xl font-bold text-emerald-700">{activeCount}</div>
						</div>
						<div className="text-xs text-emerald-600 font-medium">Active</div>
					</div>
					
					{/* Export Dropdown */}
					<div className="relative">
						<button
							onClick={() => setShowExportMenu(!showExportMenu)}
							className="flex items-center gap-2 px-4 py-2.5 bg-[#556b2f] text-white rounded-xl hover:bg-[#6d8c3a] transition-all duration-300 shadow-sm hover:shadow-md"
						>
							<IconDownload size={18} />
							Export
							<IconChevronDown size={16} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
						</button>
						
						{showExportMenu && (
							<div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
								<button
									onClick={exportToCSV}
									className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 hover:text-[#556b2f] transition-all duration-200 flex items-center gap-2"
								>
									<span className="w-2 h-2 rounded-full bg-green-400"></span>
									Export as CSV
								</button>
								<button
									onClick={exportToTSV}
									className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 hover:text-[#556b2f] transition-all duration-200 flex items-center gap-2"
								>
									<span className="w-2 h-2 rounded-full bg-blue-400"></span>
									Export as TSV
								</button>
								<button
									onClick={exportToJSON}
									className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 hover:text-[#556b2f] transition-all duration-200 flex items-center gap-2"
								>
									<span className="w-2 h-2 rounded-full bg-purple-400"></span>
									Export as JSON
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Search Bar */}
			<div className="flex gap-3">
				<div className="relative flex-1">
					<IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={20} />
					<input
						type="text"
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent shadow-sm hover:shadow transition-all duration-300 bg-white"
					/>
				</div>
				<button
					onClick={handleSearch}
					className="px-6 py-3 bg-[#556b2f] text-white rounded-xl hover:bg-[#6d8c3a] transition-all duration-300 shadow-sm hover:shadow-md font-medium"
				>
					Search
				</button>
				<button
					onClick={fetchUsers}
					className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-medium text-gray-600 hover:text-gray-800"
				>
					Reset
				</button>
			</div>

			{/* Users List */}
			{users.length === 0 ? (
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<IconUser size={32} className="text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold text-gray-700">No users found</h3>
					<p className="text-gray-500 mt-1">There are no users matching your search.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{users.map((user, index) => {
						const isHost = getRoleName(user.role).toUpperCase() === 'HOST';
						
						return (
							<div 
								key={user.id} 
								className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group"
								style={{ 
									animation: `fadeInUp 0.4s ease-out ${index * 50}ms both`,
								}}
							>
								<div className="flex items-center p-5">
									{/* Avatar */}
									<div className="flex-shrink-0 mr-5">
										<div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 group-hover:scale-110 ${
											isHost 
												? 'bg-gradient-to-br from-purple-500 to-purple-600' 
												: 'bg-gradient-to-br from-[#556b2f] to-[#6d8c3a]'
										}`}>
											{user.username.charAt(0).toUpperCase()}
										</div>
									</div>

									{/* User Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3">
											<h3 className="text-lg font-semibold text-gray-800 group-hover:text-[#556b2f] transition-colors duration-300 truncate">
												{user.username}
											</h3>
											{isHost && (
												<span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1">
													<IconShieldCheck size={14} />
													Host
												</span>
											)}
											<span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
												!user.locked 
													? "bg-emerald-100 text-emerald-700" 
													: "bg-red-100 text-red-700"
											}`}>
												<span className={`w-2 h-2 rounded-full animate-pulse ${!user.locked ? "bg-emerald-500" : "bg-red-500"}`}></span>
												{!user.locked ? "Active" : "Locked"}
											</span>
										</div>
										<div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
											<IconMail size={16} className="text-gray-400" />
											<span className="truncate">{user.email}</span>
										</div>
									</div>

									{/* Host Toggle */}
									<div className="flex items-center gap-6 ml-4">
										<div className="flex items-center gap-3">
											<span className="text-sm text-gray-500 font-medium">Host Access</span>
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={isHost}
													onChange={() => handleHostToggle(user)}
													className="sr-only peer"
												/>
												<div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#556b2f]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-[#556b2f] transition-colors duration-300"></div>
											</label>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-2 pl-6 border-l border-gray-100">
											{!user.locked ? (
												<button 
													onClick={() => handleToggleLock(user.id)}
													className="p-3 rounded-xl text-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200" 
													title="Lock Account"
												>
													<IconLock size={20} />
												</button>
											) : (
												<button 
													onClick={() => handleToggleLock(user.id)}
													className="p-3 rounded-xl text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200" 
													title="Unlock Account"
												>
													<IconLockOpen size={20} />
												</button>
											)}
											<button 
												onClick={() => handleDelete(user.id)}
												className="p-3 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200" 
												title="Delete User"
											>
												<IconTrash size={20} />
											</button>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Animation keyframes */}
			<style>{`
				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</div>
	);
}
