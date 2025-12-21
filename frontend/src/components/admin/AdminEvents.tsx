import { useState, useEffect } from "react";
import { IconCheck, IconEye, IconTrash, IconCalendar, IconMapPin, IconCategory, IconDownload, IconChevronDown } from "@tabler/icons-react";
import { RestClient } from "@/api/RestClient";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createClient } from "@supabase/supabase-js";

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

// Initialize Supabase client
const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminEvents() {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACCEPTED">("ALL");
	const [showExportMenu, setShowExportMenu] = useState(false);
	const { showToast } = useToast();
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();

	// Helper function to get Supabase public URL for event images
	const getSupabaseImageUrl = (imageUrl: string): string => {
		if (!imageUrl) return "";
		if (imageUrl.startsWith("http")) return imageUrl;
		const { data } = supabase.storage.from("volunteer").getPublicUrl(imageUrl);
		return data?.publicUrl || "";
	};

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			const result = await RestClient.getAllEventsForAdmin();
			if (result.data) {
				// Sort by date, newest first
				const sorted = result.data.sort((a: Event, b: Event) => 
					new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
				);
				setEvents(sorted);
			} else {
				showToast(result.message || "Failed to load events", "error");
			}
		} catch (err) {
			console.error("Failed to fetch events:", err);
			showToast("Failed to load events", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async (id: number) => {
		try {
			await RestClient.acceptEvent(id);
			showToast("Event approved successfully!", "success");
			fetchEvents();
		} catch (err) {
			console.error("Failed to approve event:", err);
			showToast("Failed to approve event", "error");
		}
	};

	const handleReject = async (id: number) => {
		const confirmed = await confirm({
			title: "Delete Event",
			message: "Are you sure you want to delete this event? This action cannot be undone.",
			confirmText: "Delete",
			cancelText: "Cancel",
			variant: "danger",
		});
		
		if (!confirmed) return;
		
		try {
			await RestClient.deleteEvent(id);
			showToast("Event deleted successfully", "success");
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
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const filteredEvents = events.filter(event => {
		if (filter === "ALL") return true;
		return event.status === filter;
	});

	const pendingCount = events.filter(e => e.status === "PENDING").length;
	const acceptedCount = events.filter(e => e.status === "ACCEPTED").length;

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

	const escapeCSVField = (field: string) => {
		if (field.includes(',') || field.includes('"') || field.includes('\n')) {
			return `"${field.replace(/"/g, '""')}"`;
		}
		return field;
	};

	const exportToCSV = () => {
		const headers = ['ID', 'Title', 'Type', 'Status', 'Location', 'Start Time', 'End Time', 'Description'];
		const rows = events.map(event => [
			event.id,
			escapeCSVField(event.title),
			event.type,
			event.status,
			escapeCSVField(event.location),
			event.startTime,
			event.endTime,
			escapeCSVField(event.description || '')
		]);
		const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
		downloadFile(csvContent, `events_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
		showToast("Events exported to CSV", "success");
		setShowExportMenu(false);
	};

	const exportToTSV = () => {
		const headers = ['ID', 'Title', 'Type', 'Status', 'Location', 'Start Time', 'End Time', 'Description'];
		const rows = events.map(event => [
			event.id,
			event.title,
			event.type,
			event.status,
			event.location,
			event.startTime,
			event.endTime,
			event.description || ''
		]);
		const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
		downloadFile(tsvContent, `events_export_${new Date().toISOString().split('T')[0]}.tsv`, 'text/tab-separated-values');
		showToast("Events exported to TSV", "success");
		setShowExportMenu(false);
	};

	const exportToJSON = () => {
		const exportData = events.map(event => ({
			id: event.id,
			title: event.title,
			type: event.type,
			status: event.status,
			location: event.location,
			startTime: event.startTime,
			endTime: event.endTime,
			description: event.description
		}));
		const jsonContent = JSON.stringify(exportData, null, 2);
		downloadFile(jsonContent, `events_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		showToast("Events exported to JSON", "success");
		setShowExportMenu(false);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
					<p className="text-gray-500 font-medium">Loading events...</p>
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
						Event Management
					</h1>
					<p className="text-gray-500 mt-1">Review and manage event submissions from hosts.</p>
				</div>
				
				{/* Stats and Export */}
				<div className="flex items-center gap-4">
					<div className="bg-gradient-to-br from-amber-50 to-amber-100 px-5 py-3 rounded-xl border border-amber-200">
						<div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
						<div className="text-xs text-amber-600 font-medium">Pending</div>
					</div>
					<div className="bg-gradient-to-br from-emerald-50 to-emerald-100 px-5 py-3 rounded-xl border border-emerald-200">
						<div className="text-2xl font-bold text-emerald-700">{acceptedCount}</div>
						<div className="text-xs text-emerald-600 font-medium">Approved</div>
					</div>
					
					{/* Export Dropdown */}
					<div className="relative">
						<button
							onClick={() => setShowExportMenu(!showExportMenu)}
							className="flex items-center gap-2 px-4 py-2 bg-[#556b2f] text-white rounded-lg hover:bg-[#6d8c3a] transition-colors h-full cursor-pointer"
						>
							<IconDownload size={18} />
							Export
							<IconChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
						</button>
						
						{showExportMenu && (
							<div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
								<button
									onClick={exportToCSV}
									className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
								>
									Export as CSV
								</button>
								<button
									onClick={exportToTSV}
									className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
								>
									Export as TSV
								</button>
								<button
									onClick={exportToJSON}
									className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
								>
									Export as JSON
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
				{[
					{ key: "ALL", label: "All Events" },
					{ key: "PENDING", label: "Pending" },
					{ key: "ACCEPTED", label: "Approved" }
				].map(tab => (
					<button
						key={tab.key}
						onClick={() => setFilter(tab.key as typeof filter)}
						className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
							filter === tab.key
								? "bg-white text-[#556b2f] shadow-sm"
								: "text-gray-600 hover:text-gray-800"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Events Grid */}
			{filteredEvents.length === 0 ? (
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<IconCalendar size={32} className="text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold text-gray-700">No events found</h3>
					<p className="text-gray-500 mt-1">There are no events matching your filter.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{filteredEvents.map((event, index) => (
						<div 
							key={event.id} 
							className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group"
							style={{ 
						animation: `fadeInUp 0.4s ease-out ${index * 50}ms both`,
					}}
						>
							<div className="flex">
								{/* Event Image */}
								<div className="w-48 h-36 flex-shrink-0 relative overflow-hidden">
									{event.imageUrl ? (
										<img 
											src={getSupabaseImageUrl(event.imageUrl)} 
											alt={event.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										/>
									) : (
										<div className="w-full h-full bg-gradient-to-br from-[#556b2f]/10 to-[#6d8c3a]/20 flex items-center justify-center">
											<IconCalendar size={40} className="text-[#556b2f]/30" />
										</div>
									)}
									{/* Status Badge Overlay */}
									<div className="absolute top-3 left-3">
										<span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm ${
											event.status === "PENDING" 
												? "bg-amber-500/90 text-white" 
												: "bg-emerald-500/90 text-white"
										}`}>
											{event.status === "PENDING" ? "⏳ Pending" : "✓ Approved"}
										</span>
									</div>
								</div>

								{/* Event Details */}
								<div className="flex-1 p-5 flex flex-col justify-between">
									<div>
										<div className="flex items-start justify-between gap-4">
											<div>
												<h3 className="text-lg font-semibold text-gray-800 group-hover:text-[#556b2f] transition-colors">
													{event.title}
												</h3>
												<div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
													<span className="flex items-center gap-1.5">
														<IconCategory size={16} className="text-[#556b2f]" />
														<span className="px-2 py-0.5 bg-[#556b2f]/10 text-[#556b2f] rounded-md text-xs font-medium">
															{event.type}
														</span>
													</span>
													<span className="flex items-center gap-1.5">
														<IconMapPin size={16} className="text-gray-400" />
														{event.location}
													</span>
													<span className="flex items-center gap-1.5">
														<IconCalendar size={16} className="text-gray-400" />
														{formatDate(event.startTime)}
													</span>
												</div>
											</div>
										</div>
										{event.description && (
											<p className="text-gray-500 text-sm mt-3 line-clamp-2">
												{event.description}
											</p>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-2 px-5 border-l border-gray-100">
									<a 
										href={`/events/${event.id}`}
										className="p-3 rounded-xl text-gray-400 hover:text-[#556b2f] hover:bg-[#556b2f]/10 transition-all duration-200 cursor-pointer" 
										title="View Details"
									>
										<IconEye size={22} />
									</a>
									{event.status === "PENDING" && (
										<button 
											onClick={() => handleApprove(event.id)}
											className="p-3 rounded-xl text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 cursor-pointer" 
											title="Approve Event"
										>
											<IconCheck size={22} strokeWidth={2.5} />
										</button>
									)}
									<button 
										onClick={() => handleReject(event.id)}
										className="p-3 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer" 
										title="Delete Event"
									>
										<IconTrash size={22} />
									</button>
								</div>
							</div>
						</div>
					))}
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
			<ConfirmDialogComponent />
		</div>
	);
}
