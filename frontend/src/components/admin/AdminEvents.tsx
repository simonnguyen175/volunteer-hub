import { useState, useEffect } from "react";
import { IconCheck, IconX, IconEye, IconTrash } from "@tabler/icons-react";
import { RestClient } from "@/api/RestClient";
import { useToast } from "@/components/ui/Toast";

interface Event {
	id: number;
	type: string;
	title: string;
	startTime: string;
	endTime: string;
	location: string;
	description: string;
	imageUrl: string;
	status: string;
	managerId?: number;
}

export default function AdminEvents() {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const { showToast } = useToast();

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			console.log("Fetching all events for admin...");
			const result = await RestClient.getAllEventsForAdmin();
			console.log("Admin events result:", result);
			if (result.data) {
				setEvents(result.data);
			} else {
				console.error("No data in result:", result);
				showToast(result.message || "Failed to load events", "error");
			}
		} catch (err) {
			console.error("Failed to fetch events:", err);
			showToast("Failed to load events. Please check console.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async (id: number) => {
		try {
			await RestClient.acceptEvent(id);
			// Refresh events list
			fetchEvents();
		} catch (err) {
			console.error("Failed to approve event:", err);
			showToast("Failed to approve event", "error");
		}
	};

	const handleReject = async (id: number) => {
		if (!confirm("Are you sure you want to delete this event?")) return;
		
		try {
			await RestClient.deleteEvent(id);
			// Refresh events list
			fetchEvents();
		} catch (err) {
			console.error("Failed to delete event:", err);
			showToast("Failed to delete event", "error");
		}
	};

	const formatDate = (datetime: string) => {
		return new Date(datetime).toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	};

	if (loading) {
		return <div className="text-center py-12">Loading events...</div>;
	}

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
								<th className="px-6 py-4 font-semibold">Type</th>
								<th className="px-6 py-4 font-semibold">Location</th>
								<th className="px-6 py-4 font-semibold">Date</th>
								<th className="px-6 py-4 font-semibold">Status</th>
								<th className="px-6 py-4 font-semibold text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{events.map((event) => (
								<tr key={event.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
									<td className="px-6 py-4 text-gray-600">
										<span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.type}</span>
									</td>
									<td className="px-6 py-4 text-gray-600">{event.location}</td>
									<td className="px-6 py-4 text-gray-600">{formatDate(event.startTime)}</td>
									<td className="px-6 py-4">
										<span className={`px-3 py-1 rounded-full text-xs font-medium ${
											event.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
											event.status === "ACCEPTED" ? "bg-green-100 text-green-700" : 
											"bg-red-100 text-red-700"
										}`}>
											{event.status}
										</span>
									</td>
									<td className="px-6 py-4 text-right space-x-2">
										<a 
											href={`/events/${event.id}`}
											className="inline-block p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-[#556b2f]" 
											title="View Details"
										>
											<IconEye size={18} />
										</a>
										{event.status === "PENDING" && (
											<>
												<button 
													onClick={() => handleApprove(event.id)}
													className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
													title="Approve"
												>
													<IconCheck size={18} />
												</button>
											</>
										)}
										<button 
											onClick={() => handleReject(event.id)}
											className="p-2 text-red-600 hover:bg-red-50 rounded-lg" 
											title="Delete"
										>
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
