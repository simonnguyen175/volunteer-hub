import { IconLock, IconLockOpen, IconTrash } from "@tabler/icons-react";

const mockUsers = [
	{ id: 1, name: "John Doe", email: "john@example.com", role: "Volunteer", status: "Active" },
	{ id: 2, name: "Jane Smith", email: "jane@company.com", role: "Manager", status: "Active" },
	{ id: 3, name: "Robert Admin", email: "admin@hub.com", role: "Admin", status: "Active" },
	{ id: 4, name: "Spam Bot", email: "bot@spam.com", role: "Volunteer", status: "Locked" },
];

export default function AdminUsers() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">User Management</h1>
					<p className="text-gray-500">Manage user accounts and permissions.</p>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
								<th className="px-6 py-4 font-semibold">User</th>
								<th className="px-6 py-4 font-semibold">Role</th>
								<th className="px-6 py-4 font-semibold">Status</th>
								<th className="px-6 py-4 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{mockUsers.map((user) => (
								<tr key={user.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4">
										<div className="font-medium text-gray-900">{user.name}</div>
										<div className="text-sm text-gray-500">{user.email}</div>
									</td>
									<td className="px-6 py-4">
										<span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
											{user.role}
										</span>
									</td>
									<td className="px-6 py-4">
										<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
											user.status === "Active" ? "text-green-700" : "text-red-700"
										}`}>
											<span className={`w-2 h-2 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-red-500"}`}></span>
											{user.status}
										</span>
									</td>
									<td className="px-6 py-4 text-right space-x-2">
										{user.status === "Active" ? (
											<button className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg" title="Lock Account">
												<IconLock size={18} />
											</button>
										) : (
											<button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Unlock Account">
												<IconLockOpen size={18} />
											</button>
										)}
										<button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete User">
											<IconTrash size={18} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
