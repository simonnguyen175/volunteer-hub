import { IconCheck, IconX, IconEye } from "@tabler/icons-react";

const mockEvents = [
	{ id: 1, name: "Beach Cleanup 2024", organizer: "Save The Ocean", date: "2024-03-15", status: "Pending" },
	{ id: 2, name: "Community Garden Planting", organizer: "Green Earth", date: "2024-03-20", status: "Pending" },
	{ id: 3, name: "Food Drive for Homeless", organizer: "City Charity", date: "2024-03-10", status: "Approved" },
];

export default function AdminEvents() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Event Approvals</h1>
					<p className="text-gray-500">Review and manage event submissions.</p>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
								<th className="px-6 py-4 font-semibold">Event Name</th>
								<th className="px-6 py-4 font-semibold">Organizer</th>
								<th className="px-6 py-4 font-semibold">Date</th>
								<th className="px-6 py-4 font-semibold">Status</th>
								<th className="px-6 py-4 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{mockEvents.map((event) => (
								<tr key={event.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
									<td className="px-6 py-4 text-gray-600">{event.organizer}</td>
									<td className="px-6 py-4 text-gray-600">{event.date}</td>
									<td className="px-6 py-4">
										<span className={`px-3 py-1 rounded-full text-xs font-medium ${
											event.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
											event.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
										}`}>
											{event.status}
										</span>
									</td>
									<td className="px-6 py-4 text-right space-x-2">
										<button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-[#556b2f]" title="View Details">
											<IconEye size={18} />
										</button>
										{event.status === "Pending" && (
											<>
												<button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
													<IconCheck size={18} />
												</button>
												<button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Reject">
													<IconX size={18} />
												</button>
											</>
										)}
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
