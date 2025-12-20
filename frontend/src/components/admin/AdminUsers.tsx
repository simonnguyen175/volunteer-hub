import { useState, useEffect } from "react";
import { IconLock, IconLockOpen, IconTrash, IconSearch } from "@tabler/icons-react";
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

	if (loading) {
		return <div className="text-center py-12">Loading users...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">User Management</h1>
					<p className="text-gray-500">Manage user accounts and permissions.</p>
				</div>
			</div>

			{/* Search Bar */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
					<input
						type="text"
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
					/>
				</div>
				<button
					onClick={handleSearch}
					className="px-6 py-2 bg-[#556b2f] text-white rounded-lg hover:bg-[#6d8c3a] transition-colors"
				>
					Search
				</button>
				<button
					onClick={fetchUsers}
					className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
				>
					Reset
				</button>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
								<th className="px-6 py-4 font-semibold">User</th>
								<th className="px-6 py-4 font-semibold">Is Host</th>
								<th className="px-6 py-4 font-semibold">Status</th>
								<th className="px-6 py-4 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{users.map((user) => {
								const isHost = getRoleName(user.role).toUpperCase() === 'HOST';
								
								return (
									<tr key={user.id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4">
											<div className="font-medium text-gray-900">{user.username}</div>
											<div className="text-sm text-gray-500">{user.email}</div>
										</td>
										<td className="px-6 py-4">
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={isHost}
													onChange={() => handleHostToggle(user)}
													className="sr-only peer"
												/>
												<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#556b2f]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556b2f]"></div>
												<span className="ms-3 text-sm font-medium text-gray-700">
													{isHost ? 'Host' : 'User'}
												</span>
											</label>
										</td>
										<td className="px-6 py-4">
											<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
												!user.locked ? "text-green-700" : "text-red-700"
											}`}>
												<span className={`w-2 h-2 rounded-full ${!user.locked ? "bg-green-500" : "bg-red-500"}`}></span>
												{!user.locked ? "Active" : "Locked"}
											</span>
										</td>
										<td className="px-6 py-4 text-right space-x-2">
											{!user.locked ? (
												<button 
													onClick={() => handleToggleLock(user.id)}
													className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg" 
													title="Lock Account"
												>
													<IconLock size={18} />
												</button>
											) : (
												<button 
													onClick={() => handleToggleLock(user.id)}
													className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
													title="Unlock Account"
												>
													<IconLockOpen size={18} />
												</button>
											)}
											<button 
												onClick={() => handleDelete(user.id)}
												className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
												title="Delete User"
											>
												<IconTrash size={18} />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
