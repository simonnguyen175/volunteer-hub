import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

import { IconSearch, IconGridDots, IconList, IconArrowsSort, IconPlus } from "@tabler/icons-react";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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
	managerName?: string;
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
	const [timeStatusFilter, setTimeStatusFilter] = useState<"all" | "past" | "ongoing" | "future">("all");

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

	// Categorize events based on time status
	const now = new Date();
	const categorizeEvent = (event: Event & { fullImageUrl: string }) => {
		const startTime = new Date(event.startTime);
		const endTime = new Date(event.endTime);
		
		if (endTime < now) return "past";
		if (startTime <= now && endTime >= now) return "ongoing";
		return "future";
	};

	// Filter by time status
	const timeFilteredEvents = timeStatusFilter === "all" 
		? filteredEvents 
		: filteredEvents.filter(event => categorizeEvent(event) === timeStatusFilter);

	// For hosts, split events into "My Events" and "Other Events"
	const myHostedEvents = isHost && user?.id 
		? timeFilteredEvents.filter(event => event.managerName === user?.username)
		: [];
	const otherEvents = isHost && user?.id
		? timeFilteredEvents.filter(event => event.managerName !== user?.username)
		: timeFilteredEvents;

	// Count events by time status for badges
	const pastCount = filteredEvents.filter(e => categorizeEvent(e) === "past").length;
	const ongoingCount = filteredEvents.filter(e => categorizeEvent(e) === "ongoing").length;
	const futureCount = filteredEvents.filter(e => categorizeEvent(e) === "future").length;

	return (
		<div className="min-h-screen bg-white">

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="relative top-10 mb-10 flex items-center justify-center">
					<h1 className="font-(family-name:--font-crimson) font-medium text-[5rem] text-center m-4 text-gray-900">
						Our Events.
					</h1>
					{isHost && (
						<button
							onClick={() => setIsCreateModalOpen(true)}
							className="absolute right-0 flex items-center gap-2 px-6 py-3 bg-[#556b2f] text-white rounded-xl font-semibold font-(family-name:--font-dmsans) hover:bg-[#6d8c3a] transition-all shadow-md hover:shadow-lg cursor-pointer"
						>
							<IconPlus size={20} />
							Create Event
						</button>
					)}
				</div>

					{/* Sort and Filter Controls */}
					<div className="space-y-6">
						{/* Top Row: Search and View Toggle */}
						<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
							<div className="relative flex-1 w-full md:max-w-md">
								<IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="text"
									placeholder="Search events..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-11 pr-10 py-3 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#556b2f]/20 font-(family-name:--font-dmsans) transition-all text-gray-800 placeholder:text-gray-400"
								/>
								{isSearching && (
									<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-[#556b2f]"></div>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
								<button
									onClick={() => setViewMode("grid")}
									className={`p-2 rounded-lg transition-all cursor-pointer ${
										viewMode === "grid"
											? "bg-white text-[#556b2f] shadow-sm"
											: "text-gray-400 hover:text-gray-600"
									}`}
								>
									<IconGridDots size={20} />
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={`p-2 rounded-lg transition-all cursor-pointer ${
										viewMode === "list"
											? "bg-white text-[#556b2f] shadow-sm"
											: "text-gray-400 hover:text-gray-600"
									}`}
								>
									<IconList size={20} />
								</button>
							</div>
						</div>

						{/* Filters Divider */}
						<div className="h-px bg-gray-100" />

						{/* Middle Row: Filters and Sort */}
						<div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
							{/* Event Type Filter - Clean Pills */}
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => setTypeFilter("")}
									className={`px-5 py-2.5 rounded-full text-sm font-bold font-(family-name:--font-dmsans) transition-all border cursor-pointer ${
										typeFilter === ""
											? "bg-[#556b2f] text-white border-[#556b2f]"
											: "bg-white text-gray-600 border-gray-200 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									All Types
								</button>
								{["HELPING", "PLANTING", "MEDICAL", "FUNDRAISER", "FOOD"].map((type) => (
									<button
										key={type}
										onClick={() => setTypeFilter(type)}
										className={`px-5 py-2.5 rounded-full text-sm font-bold font-(family-name:--font-dmsans) transition-all border capitalize cursor-pointer ${
											typeFilter === type
												? "bg-[#556b2f] text-white border-[#556b2f]"
												: "bg-white text-gray-600 border-gray-200 hover:border-[#556b2f] hover:text-[#556b2f]"
										}`}
									>
										{type.toLowerCase()}
									</button>
								))}
							</div>

							{/* Sort and Date */}
							<div className="flex flex-wrap items-center gap-4">
								<div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
									<IconArrowsSort className="text-gray-400 w-4 h-4" />
									<span className="text-sm font-bold text-gray-500 font-(family-name:--font-dmsans)">Sort:</span>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as "title" | "startTime" | "endTime")}
										className="bg-transparent border-none text-sm font-bold text-gray-800 focus:outline-none focus:ring-0 font-(family-name:--font-dmsans) cursor-pointer"
									>
										<option value="title">Name</option>
										<option value="startTime">Start Date</option>
										<option value="endTime">End Date</option>
									</select>
								</div>

								<div className="flex items-center gap-2">
									<input
										type="date"
										value={startDateFilter}
										onChange={(e) => setStartDateFilter(e.target.value)}
										className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-(family-name:--font-dmsans) focus:outline-none focus:border-[#556b2f] text-gray-600"
									/>
									<span className="text-gray-400">-</span>
									<input
										type="date"
										value={endDateFilter}
										onChange={(e) => setEndDateFilter(e.target.value)}
										className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-(family-name:--font-dmsans) focus:outline-none focus:border-[#556b2f] text-gray-600"
									/>
								</div>
							</div>
						</div>

						{/* Bottom Row: Status Tabs */}
						<div className="flex border-b border-gray-100">
							{[
								{ id: "all", label: "All Events", count: filteredEvents.length },
								{ id: "future", label: "Upcoming", count: futureCount },
								{ id: "ongoing", label: "Ongoing", count: ongoingCount },
								{ id: "past", label: "Past", count: pastCount }
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setTimeStatusFilter(tab.id as any)}
									className={`px-6 py-4 text-sm font-bold font-(family-name:--font-dmsans) transition-all relative flex items-center gap-2 cursor-pointer ${
										timeStatusFilter === tab.id
											? "text-[#556b2f]"
											: "text-gray-400 hover:text-gray-600"
									}`}
								>
									{tab.label}
									<span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
										timeStatusFilter === tab.id
											? "bg-[#556b2f]/10 text-[#556b2f]"
											: "bg-gray-100 text-gray-500"
									}`}>
										{tab.count}
									</span>
									{timeStatusFilter === tab.id && (
										<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-full" />
									)}
								</button>
							))}
						</div>
					</div>

				{/* Events Grid/List Toggle */}
				{isHost && myHostedEvents.length > 0 && (
					<>
						{/* My Hosted Events Section */}
						<div className="mb-8">
							<h2 className="font-(family-name:--font-crimson) text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-[#556b2f] rounded-full"></span>
								My Hosted Events
								<span className="ml-2 px-2 py-0.5 bg-[#556b2f]/10 text-[#556b2f] rounded-full text-sm font-medium">
									{myHostedEvents.length}
								</span>
							</h2>
							{viewMode === "grid" ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{myHostedEvents.map((event, index) => {
										const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
										const { dateStr: endDate, timeStr: endTimeStr } = formatDateTime(event.endTime);
										return (
											<Link key={`${event.id}-${viewMode}`} to={`/events/${event.id}`} style={{ animation: `fadeInUp 0.4s ease-out ${index * 50}ms both` }}>
												<Card className="group relative overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer ring-2 ring-[#556b2f]/30">
													<div className="absolute top-2 right-2 z-20 px-2 py-1 bg-[#556b2f] text-white text-xs font-semibold rounded-lg">
														Hosted by you
													</div>
													<div className="aspect-video w-full overflow-hidden">
														<img
															src={event.fullImageUrl}
															alt={event.title}
															className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
														/>
													</div>
													<div className="relative">
														<div className="relative z-10 p-4 bg-white group-hover:bg-transparent transition-colors">
															<CardHeader className="p-0">
																<CardTitle className="font-(family-name:--font-crimson) text-xl text-gray-900 group-hover:text-white transition-colors">
																	{event.title}
																</CardTitle>
																<CardDescription className="font-(family-name:--font-dmsans) text-sm text-gray-700 group-hover:text-white/90 transition-colors">
																	{startDate} {startTimeStr} - {endDate} {endTimeStr}
																</CardDescription>
															</CardHeader>
														</div>
														<div className="absolute bottom-0 left-0 w-full h-[110%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-[#556b2f] via-[#556b2f]/85 to-transparent p-4 z-0" />
													</div>
												</Card>
											</Link>
										);
									})}
								</div>
							) : (
								<div className="flex flex-col gap-4">
									{myHostedEvents.map((event, index) => {
										const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
										const { dateStr: endDate, timeStr: endTimeStr } = formatDateTime(event.endTime);
										return (
											<Link key={`${event.id}-${viewMode}`} to={`/events/${event.id}`} style={{ animation: `fadeInUp 0.4s ease-out ${index * 50}ms both` }}>
												<Card className="group relative overflow-hidden hover:shadow-lg transition-all cursor-pointer ring-2 ring-[#556b2f]/30">
													<div className="flex flex-row">
														<div className="w-64 h-40 shrink-0 overflow-hidden relative">
															<div className="absolute top-2 left-2 z-20 px-2 py-1 bg-[#556b2f] text-white text-xs font-semibold rounded-lg">
																Hosted by you
															</div>
															<img
																src={event.fullImageUrl}
																alt={event.title}
																className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
															/>
														</div>
														<div className="flex-1 relative h-40">
															<div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-white group-hover:bg-transparent transition-colors">
																<CardHeader className="p-0">
																	<CardTitle className="font-(family-name:--font-crimson) text-2xl text-gray-900 group-hover:text-white transition-colors">
																		{event.title}
																	</CardTitle>
																	<CardDescription className="font-(family-name:--font-dmsans) text-gray-700 group-hover:text-white/90 transition-colors">
																		{startDate} {startTimeStr} - {endDate} {endTimeStr}
																	</CardDescription>
																</CardHeader>
															</div>
															<div className="absolute bottom-0 left-0 w-full h-[150%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-[#556b2f] via-[#556b2f]/85 to-transparent p-4 z-0" />
														</div>
													</div>
												</Card>
											</Link>
										);
									})}
								</div>
							)}
						</div>

						{/* Other Events Section Header */}
						{otherEvents.length > 0 && (
							<h2 className="font-(family-name:--font-crimson) text-2xl font-bold text-gray-900 mb-4 mt-8 flex items-center gap-2">
								<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
								Other Events
								<span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
									{otherEvents.length}
								</span>
							</h2>
						)}
					</>
				)}

				{viewMode === "grid" ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{otherEvents.map((event, index) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { dateStr: endDate, timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={`${event.id}-${viewMode}`} to={`/events/${event.id}`} style={{ animation: `fadeInUp 0.4s ease-out ${index * 50}ms both` }}>
											<Card className="group relative overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
												<div className="aspect-video w-full overflow-hidden">
														<img
															src={event.fullImageUrl}
															alt={event.title}
															className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
														/>
													</div>

													{/* White info strip remains visible; overlay slides up behind it */}
													<div className="relative">
														<div className="relative z-10 p-4 bg-white group-hover:bg-transparent transition-colors">
															<CardHeader className="p-0">
																{event.managerName && (
																	<CardDescription className="font-(family-name:--font-crimson) text-sm text-gray-600 group-hover:text-white/80 transition-colors mt-1">
																		Host: {event.managerName}
																	</CardDescription>
																)}
																<CardTitle className="font-(family-name:--font-crimson) text-xl text-gray-900 group-hover:text-white transition-colors">
																	{event.title}
																</CardTitle>
																<CardDescription className="font-(family-name:--font-dmsans) text-sm text-gray-700 group-hover:text-white/90 transition-colors">
																	{startDate} {startTimeStr} - {endDate} {endTimeStr}
																</CardDescription>
																
															</CardHeader>
														</div>

														<div className="absolute bottom-0 left-0 w-full h-[110%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-[#556b2f] via-[#556b2f]/85 to-transparent p-4 z-0" />
													</div>
											</Card>
								</Link>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{otherEvents.map((event, index) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { dateStr: endDate, timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={`${event.id}-${viewMode}`} to={`/events/${event.id}`} style={{ animation: `fadeInUp 0.4s ease-out ${index * 50}ms both` }}>
									<Card className="group relative overflow-hidden hover:shadow-lg transition-all cursor-pointer">
										<div className="flex flex-row">
											<div className="w-64 h-40 shrink-0 overflow-hidden">
												<img
													src={event.fullImageUrl}
													alt={event.title}
													className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
												/>
											</div>
											<div className="flex-1 relative h-40">
												<div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-white group-hover:bg-transparent transition-colors">
													<CardHeader className="p-0">
														{event.managerName && (
														<CardDescription className="font-(family-name:--font-crimson) text-md text-gray-600 group-hover:text-white/80 transition-colors mt-1">
															Host: {event.managerName}
														</CardDescription>
													)}
														<CardTitle className="font-(family-name:--font-crimson) text-2xl text-gray-900 group-hover:text-white transition-colors">
															{event.title}
														</CardTitle>
														<CardDescription className="font-(family-name:--font-dmsans) text-gray-700 group-hover:text-white/90 transition-colors">
															{startDate} {startTimeStr} - {endDate} {endTimeStr}
														</CardDescription>
													
												</CardHeader>
											</div>

											{/* Sliding overlay for list view (behind the white strip) */}
											<div className="absolute bottom-0 left-0 w-full h-[150%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-[#556b2f] via-[#556b2f]/85 to-transparent p-4 z-0" />
										</div>
									</div>
								</Card>
							</Link>
							);
						})}
					</div>
				)}

				{filteredEvents.length === 0 && (
					<div className="text-center py-12 text-gray-500 font-(family-name:--font-dmsans)">
						No events match your search criteria.
					</div>
				)}
			</div>

			{/* Create Event Modal */}
			<CreateEventModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onEventCreated={fetchEvents}
			/>

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
