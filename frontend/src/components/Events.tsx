import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

import { IconSearch, IconGridDots, IconList, IconFilter, IconArrowsSort, IconPlus } from "@tabler/icons-react";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { RestClient } from "@/api/RestClient";
import { useAuth } from "@/contexts/AuthContext";
import CreateEventModal from "./CreateEventModal";

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
}

export default function Events() {
	// Supabase client
	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_ANON_KEY
	);

	const { user } = useAuth();
	const [events, setEvents] = useState<Event[]>([]);
	const [eventsWithImages, setEventsWithImages] = useState<(Event & { fullImageUrl: string })[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [sortBy, setSortBy] = useState<"title" | "startTime" | "endTime">("startTime");
	const [startDateFilter, setStartDateFilter] = useState("");
	const [endDateFilter, setEndDateFilter] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	// Check if user is a host
	const rawRole = user?.role;
	const roleName = typeof rawRole === "string" ? rawRole : (rawRole as { name?: string } | undefined)?.name ?? "";
	const isHost = roleName === "HOST" || roleName === "ADMIN";

	// Helper function to get Supabase public URL for event images
	const getSupabaseImageUrl = (imageUrl: string): string => {
		if (!imageUrl) return "";
		if (imageUrl.startsWith("http")) return imageUrl;
		const { data } = supabase.storage.from("volunteer").getPublicUrl(imageUrl);
		return data?.publicUrl || "";
	};

	// Fetch events from API (with search and filter)
	const fetchEvents = async () => {
		setIsSearching(true);
		try {
			// Use search API if there's a query or type filter
			const result = searchQuery || typeFilter 
				? await RestClient.searchEvents(searchQuery, typeFilter)
				: await RestClient.getEvents();
			
			if (result.data) {
				setEvents(result.data);
			}
		} catch (err) {
			console.error("Failed to fetch events:", err);
		} finally {
			setIsSearching(false);
		}
	};

	useEffect(() => {
		// Debounce search
		const timeoutId = setTimeout(fetchEvents, 300);
		return () => clearTimeout(timeoutId);
	}, [searchQuery, typeFilter]);

	// Load Supabase images for events
	useEffect(() => {
		if (events.length > 0) {
			const eventsWithFullUrls = events.map((event) => ({
				...event,
				fullImageUrl: getSupabaseImageUrl(event.imageUrl),
			}));
			setEventsWithImages(eventsWithFullUrls);
		}
	}, [events]);

	// Helper function to format datetime for display
	const formatDateTime = (datetime: string) => {
		const date = new Date(datetime);
		const dateStr = date.toLocaleDateString('en-GB');
		const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
		return { dateStr, timeStr };
	};

	// Filter events by search query and date range
	let filteredEvents = eventsWithImages.filter((event) => {
		const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
		
		let matchesDateRange = true;
		if (startDateFilter || endDateFilter) {
			const eventStartDate = new Date(event.startTime);
			
			if (startDateFilter) {
				const startFilter = new Date(startDateFilter);
				matchesDateRange = matchesDateRange && eventStartDate >= startFilter;
			}
			
			if (endDateFilter) {
				const endFilter = new Date(endDateFilter);
				endFilter.setHours(23, 59, 59, 999); // Include the entire end day
				matchesDateRange = matchesDateRange && eventStartDate <= endFilter;
			}
		}
		
		return matchesSearch && matchesDateRange;
	});

	// Sort events based on selected criteria
	filteredEvents = [...filteredEvents].sort((a, b) => {
		if (sortBy === "title") {
			return a.title.localeCompare(b.title);
		} else if (sortBy === "startTime") {
			return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
		} else if (sortBy === "endTime") {
			return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
		}
		return 0;
	});

	return (
		<div className="min-h-screen bg-gray-50">

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="relative top-10 mb-10 flex items-center justify-center">
					<h1 className="font-(family-name:--font-crimson) font-medium text-[5rem] text-center m-4">
						Our Events.
					</h1>
					{isHost && (
						<button
							onClick={() => setIsCreateModalOpen(true)}
							className="absolute right-0 flex items-center gap-2 px-6 py-3 bg-[#556b2f] text-white rounded-xl font-semibold hover:bg-[#6d8c3a] transition-all shadow-md hover:shadow-lg"
						>
							<IconPlus size={20} />
							Create Event
						</button>
					)}
				</div>

				{/* Search and View Toggle */}
				<div className="flex flex-col gap-4 mb-8">
					<div className="flex items-center gap-4">
						<div className="relative flex-1 max-w-md">
							<IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								placeholder="Search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-700"
							/>
						</div>

						<div className="flex items-center gap-2">
							<IconGridDots
								size={22}
								className={
									viewMode === "grid"
										? "text-lime-700"
										: "text-gray-400"
								}
							/>
							<Switch
								checked={viewMode === "list"}
								onCheckedChange={(checked) =>
									setViewMode(checked ? "list" : "grid")
								}
								className="data-[state=checked]:bg-lime-700"
							/>
							<IconList
								size={22}
								className={
									viewMode === "list"
										? "text-lime-700"
										: "text-gray-400"
								}
							/>
						</div>
					</div>

					{/* Sort and Filter Controls */}
					<div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
						{/* Event Type Filter */}
						<div className="flex items-center gap-2">
							<IconFilter className="text-gray-600 w-5 h-5" />
							<label className="text-sm font-semibold text-gray-700">Type:</label>
							<select
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value)}
								className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-700"
							>
								<option value="">All Types</option>
								<option value="HELPING">Helping</option>
								<option value="PLANTING">Planting</option>
								<option value="MEDICAL">Medical</option>
								<option value="FUNDRAISER">Fundraiser</option>
								<option value="FOOD">Food</option>
							</select>
						</div>

						{/* Sort By */}
						<div className="flex items-center gap-2">
							<IconArrowsSort className="text-gray-600 w-5 h-5" />
							<label className="text-sm font-semibold text-gray-700">Sort by:</label>
							<select
								value={sortBy}
							onChange={(e) => setSortBy(e.target.value as "title" | "startTime" | "endTime")}
							className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-700"
						>
							<option value="title">Name</option>
								<option value="startTime">Start Time</option>
								<option value="endTime">End Time</option>
							</select>
						</div>

						{/* Date Range Filter */}
						<div className="flex items-center gap-2 flex-1">
							<label className="text-sm font-semibold text-gray-700">Date:</label>
							<div className="flex items-center gap-2">
								<input
									type="date"
									value={startDateFilter}
									onChange={(e) => setStartDateFilter(e.target.value)}
									className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-700"
									placeholder="Start date"
								/>
				<span className="text-gray-500">to</span>
								<input
									type="date"
									value={endDateFilter}
									onChange={(e) => setEndDateFilter(e.target.value)}
									className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-700"
									placeholder="End date"
								/>
								{(startDateFilter || endDateFilter) && (
									<button
										onClick={() => {
											setStartDateFilter("");
											setEndDateFilter("");
										}}
										className="text-sm text-lime-700 hover:text-lime-800 font-semibold"
									>
										Clear
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Events Grid/List Toggle */}
				{viewMode === "grid" ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredEvents.map((event) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={event.id} to={`/events/${event.id}`}>
									<Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
										<div className="aspect-video w-full overflow-hidden">
											<img
												src={event.fullImageUrl}
												alt={event.title}
												className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
											/>
										</div>

										<CardHeader className="">
											<CardTitle className="font-(family-name:--font-crimson) text-2xl">
												{event.title}
											</CardTitle>
											<CardDescription>
												{startDate} • {startTimeStr} - {endTimeStr}
											</CardDescription>
										</CardHeader>
									</Card>
								</Link>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{filteredEvents.map((event) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={event.id} to={`/events/${event.id}`}>
									<Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer">
										<div className="flex flex-row">
											<div className="w-64 h-40 shrink-0 overflow-hidden">
												<img
													src={event.fullImageUrl}
													alt={event.title}
													className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
												/>
											</div>

											<div className="flex-1">
												<CardHeader>
													<CardTitle className="font-(family-name:--font-crimson) text-2xl">
														{event.title}
													</CardTitle>
													<CardDescription>
														{startDate} • {startTimeStr} - {endTimeStr}
													</CardDescription>
												</CardHeader>
											</div>
										</div>
									</Card>
								</Link>
							);
						})}
					</div>
				)}

				{filteredEvents.length === 0 && (
					<div className="text-center py-12 text-gray-500">
						Found no event matches your search.
					</div>
				)}
			</div>

			{/* Create Event Modal */}
			<CreateEventModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onEventCreated={fetchEvents}
			/>
		</div>
	);
}
