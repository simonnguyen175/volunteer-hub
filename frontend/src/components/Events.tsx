import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

import { IconSearch, IconGridDots, IconList, IconFilter, IconArrowsSort, IconPlus, IconChevronDown, IconChevronUp } from "@tabler/icons-react";

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
	const [isTypeFilterExpanded, setIsTypeFilterExpanded] = useState(true);

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

	// For hosts, split events into "My Events" and "Other Events"
	const myHostedEvents = isHost && user?.id 
		? filteredEvents.filter(event => event.managerName === user?.username)
		: [];
	const otherEvents = isHost && user?.id
		? filteredEvents.filter(event => event.managerName !== user?.username)
		: filteredEvents;

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
							className="absolute right-0 flex items-center gap-2 px-6 py-3 bg-[#556b2f] text-white rounded-xl font-semibold font-(family-name:--font-dmsans) hover:bg-[#6d8c3a] transition-all shadow-md hover:shadow-lg"
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
								placeholder="Search events..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-(family-name:--font-dmsans)"
							/>
						</div>

						<div className="flex items-center gap-2">
							<IconGridDots
								size={22}
								className={
									viewMode === "grid"
										? "text-[#556b2f]"
										: "text-gray-400"
								}
							/>
							<Switch
								checked={viewMode === "list"}
								onCheckedChange={(checked) =>
									setViewMode(checked ? "list" : "grid")
								}
								className="data-[state=checked]:bg-[#556b2f]"
							/>
							<IconList
								size={22}
								className={
									viewMode === "list"
										? "text-[#556b2f]"
										: "text-gray-400"
								}
							/>
						</div>
					</div>

					{/* Sort and Filter Controls */}
					<div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-[#556b2f]/5 to-[#747e59]/5 rounded-xl border border-[#556b2f]/20">
						{/* Event Type Filter - Visual Badges */}
						<div className="flex flex-col gap-2">
						<button
							onClick={() => setIsTypeFilterExpanded(!isTypeFilterExpanded)}
							className="text-sm font-bold text-[#556b2f] font-(family-name:--font-dmsans) uppercase tracking-wide flex items-center gap-2 hover:text-[#6d8c3a] transition-colors w-fit"
						>
							<IconFilter className="w-4 h-4" />
							{isTypeFilterExpanded ? <IconChevronUp className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4" />}
						</button>
						{isTypeFilterExpanded && (
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => setTypeFilter("")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === ""
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									All Types
								</button>
								<button
									onClick={() => setTypeFilter("HELPING")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === "HELPING"
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									Helping
								</button>
								<button
									onClick={() => setTypeFilter("PLANTING")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === "PLANTING"
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									Planting
								</button>
								<button
									onClick={() => setTypeFilter("MEDICAL")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === "MEDICAL"
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									Medical
								</button>
								<button
									onClick={() => setTypeFilter("FUNDRAISER")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === "FUNDRAISER"
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									Fundraiser
								</button>
								<button
									onClick={() => setTypeFilter("FOOD")}
									className={`px-4 py-2 rounded-lg font-(family-name:--font-dmsans) font-semibold transition-all ${
										typeFilter === "FOOD"
											? "bg-[#556b2f] text-white shadow-md"
											: "bg-white text-gray-700 border border-gray-300 hover:border-[#556b2f] hover:text-[#556b2f]"
									}`}
								>
									Food
								</button>
							</div>
						)}
						</div>

						{/* Sort and Date Controls */}
						<div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#556b2f]/20">
							{/* Sort By */}
							<div className="flex items-center gap-2">
								<IconArrowsSort className="text-[#556b2f] w-5 h-5" />
								<label className="text-sm font-semibold text-gray-700 font-(family-name:--font-dmsans)">Sort by:</label>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as "title" | "startTime" | "endTime")}
									className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-(family-name:--font-dmsans)"
								>
									<option value="title">Name</option>
									<option value="startTime">Start Time</option>
									<option value="endTime">End Time</option>
								</select>
							</div>

							{/* Date Range Filter */}
							<div className="flex items-center gap-2 flex-1">
								<label className="text-sm font-semibold text-gray-700 font-(family-name:--font-dmsans)">Date:</label>
								<div className="flex items-center gap-2">
									<input
										type="date"
										value={startDateFilter}
										onChange={(e) => setStartDateFilter(e.target.value)}
										className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-(family-name:--font-dmsans)"
										placeholder="Start date"
									/>
									<span className="text-gray-500 font-(family-name:--font-dmsans)">to</span>
									<input
										type="date"
										value={endDateFilter}
										onChange={(e) => setEndDateFilter(e.target.value)}
										className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-(family-name:--font-dmsans)"
										placeholder="End date"
									/>
									{(startDateFilter || endDateFilter) && (
										<button
											onClick={() => {
												setStartDateFilter("");
												setEndDateFilter("");
											}}
											className="text-sm text-[#556b2f] hover:text-[#6d8c3a] font-semibold font-(family-name:--font-dmsans)"
										>
											Clear
										</button>
									)}
								</div>
							</div>
						</div>
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
									{myHostedEvents.map((event) => {
										const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
										const { timeStr: endTimeStr } = formatDateTime(event.endTime);
										return (
											<Link key={event.id} to={`/events/${event.id}`}>
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
																	{startDate} • {startTimeStr} - {endTimeStr}
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
									{myHostedEvents.map((event) => {
										const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
										const { timeStr: endTimeStr } = formatDateTime(event.endTime);
										return (
											<Link key={event.id} to={`/events/${event.id}`}>
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
																		{startDate} • {startTimeStr} - {endTimeStr}
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
						{otherEvents.map((event) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={event.id} to={`/events/${event.id}`}>
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
																	{startDate} • {startTimeStr} - {endTimeStr}
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
						{otherEvents.map((event) => {
							const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);
							const { timeStr: endTimeStr } = formatDateTime(event.endTime);
							return (
								<Link key={event.id} to={`/events/${event.id}`}>
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
															{startDate} • {startTimeStr} - {endTimeStr}
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
		</div>
	);
}
