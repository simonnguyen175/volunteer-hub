import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	IconCalendarEvent,
	IconClock,
	IconUsers,
	IconCheck,
	IconX,
	IconChevronRight,
	IconHistory,
	IconPlayerPlay,
	IconCircleCheck,
	IconCircleX,
} from "@tabler/icons-react";
import { createClient } from "@supabase/supabase-js";
import { RestClient } from "../api/RestClient";
import { useAuth } from "../contexts/AuthContext";

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EventUser {
	id: number;
	userId: number;
	username: string;
	email: string;
	eventId: number;
	eventTitle: string;
	eventImageUrl: string;
	eventStartTime: string;
	eventEndTime: string;
	status: boolean;
	completed: boolean;
}

interface HostedEvent {
	id: number;
	type: string;
	title: string;
	startTime: string;
	endTime: string;
	location: string;
	description: string;
	imageUrl: string;
	status: string;
	managerId: number;
	managerName: string;
}

interface Participant {
	id: number;
	userId: number;
	username: string;
	email: string;
	eventId: number;
	eventTitle: string;
	status: boolean;
	completed: boolean;
}

const getSupabaseImageUrl = (imagePath: string): string => {
	if (!imagePath) return "";
	const { data } = supabase.storage.from("volunteer").getPublicUrl(imagePath);
	return data.publicUrl;
};

const formatDateTime = (isoString: string) => {
	const date = new Date(isoString);
	return {
		date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
		time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
	};
};

function EventCard({
	event,
	type,
	subType,
	onManage,
}: {
	event: EventUser | HostedEvent;
	type: "joined" | "pending" | "hosted";
	subType?: "past" | "ongoing" | "going";
	onManage?: () => void;
}) {
	const isHostedEvent = "managerName" in event;
	const imageUrl = isHostedEvent ? event.imageUrl : (event as EventUser).eventImageUrl;
	const title = isHostedEvent ? event.title : (event as EventUser).eventTitle;
	const eventId = isHostedEvent ? event.id : (event as EventUser).eventId;
	const isCompleted = !isHostedEvent && (event as EventUser).completed;

	return (
		<div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 transform hover:-translate-y-1">
			<div className="flex flex-col sm:flex-row">
				<div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 relative overflow-hidden">
					<img
						src={getSupabaseImageUrl(imageUrl)}
						alt={title}
						className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
					/>
					<div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
				</div>
				<div className="flex-1 p-6 flex flex-col justify-between">
					<div>
						<div className="flex flex-wrap items-start justify-between gap-4 mb-2">
							<h3 className="font-(family-name:--font-crimson) text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#556b2f] transition-colors">
								{title}
							</h3>
							<span
								className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold font-(family-name:--font-dmsans) uppercase tracking-wider flex items-center gap-1.5 ${
									subType === "past" 
										? isCompleted 
											? "bg-green-50 text-green-700 border border-green-100" 
											: "bg-red-50 text-red-700 border border-red-100"
										: subType === "ongoing"
										? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
										: subType === "going"
										? "bg-[#556b2f]/10 text-[#556b2f] border border-[#556b2f]/20"
										: type === "joined"
										? "bg-[#556b2f]/10 text-[#556b2f]"
										: type === "pending"
										? "bg-amber-50 text-amber-700 border border-amber-100"
										: "bg-blue-50 text-blue-700 border border-blue-100"
								}`}
							>
								{subType === "past" ? (
									<>
										{isCompleted ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
										{isCompleted ? "Completed" : "Incomplete"}
									</>
								) : subType === "ongoing" ? (
									<>
										<IconPlayerPlay size={14} /> In Progress
									</>
								) : subType === "going" ? (
									<>
										<IconCalendarEvent size={14} /> Upcoming
									</>
								) : type === "joined" ? (
									"Joined"
								) : type === "pending" ? (
									<>
										<IconClock size={14} /> Pending
									</>
								) : (
									(event as HostedEvent).status
								)}
							</span>
						</div>
						
						{isHostedEvent && (
							<div className="flex items-center gap-4 text-sm text-gray-500 font-medium font-(family-name:--font-dmsans) mt-2">
								<div className="flex items-center gap-1.5">
									<IconCalendarEvent size={16} className="text-[#556b2f]" />
									<span>{formatDateTime(event.startTime).date}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<IconClock size={16} className="text-[#556b2f]" />
									<span>{formatDateTime(event.startTime).time}</span>
								</div>
							</div>
						)}
					</div>

					<div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
						<Link
							to={`/events/${eventId}`}
							className="text-[#556b2f] hover:text-[#6d8c3a] text-sm font-bold font-(family-name:--font-dmsans) flex items-center gap-2 group/link"
						>
							View Event
							<IconChevronRight size={16} className="transform group-hover/link:translate-x-1 transition-transform" />
						</Link>
						
						{type === "hosted" && onManage && (
							<button
								onClick={(e) => {
									e.preventDefault();
									onManage();
								}}
								className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-[#556b2f]/10 text-gray-700 hover:text-[#556b2f] rounded-lg text-sm font-bold font-(family-name:--font-dmsans) transition-all"
							>
								<IconUsers size={16} />
								Manage Participants
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// Participant Management Modal
function ParticipantModal({
	event,
	onClose,
}: {
	event: HostedEvent;
	onClose: () => void;
}) {
	const [activeTab, setActiveTab] = useState<"pending" | "accepted">("pending");
	const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
	const [acceptedParticipants, setAcceptedParticipants] = useState<Participant[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	useEffect(() => {
		fetchParticipants();
	}, [event.id]);

	const fetchParticipants = async () => {
		try {
			const [pendingResult, acceptedResult] = await Promise.all([
				RestClient.getPendingParticipants(event.id),
				RestClient.getAcceptedParticipants(event.id),
			]);

			if (pendingResult.data) setPendingParticipants(pendingResult.data);
			if (acceptedResult.data) setAcceptedParticipants(acceptedResult.data);
		} catch (err) {
			console.error("Failed to fetch participants:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = async (eventUserId: number) => {
		setActionLoading(eventUserId);
		try {
			await RestClient.acceptUserToEvent(eventUserId);
			fetchParticipants();
		} catch (err) {
			console.error("Failed to accept user:", err);
		} finally {
			setActionLoading(null);
		}
	};

	const handleDeny = async (eventUserId: number) => {
		setActionLoading(eventUserId);
		try {
			await RestClient.denyUserToEvent(eventUserId);
			fetchParticipants();
		} catch (err) {
			console.error("Failed to deny user:", err);
		} finally {
			setActionLoading(null);
		}
	};

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity cursor-pointer" onClick={onClose} />
			<div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
					<div>
						<h2 className="text-2xl font-bold font-(family-name:--font-crimson) text-gray-900">Manage Participants</h2>
						<p className="text-sm text-gray-500 font-(family-name:--font-dmsans) mt-1 max-w-md truncate">{event.title}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
					>
						<IconX size={24} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-100 px-8">
					<button
						onClick={() => setActiveTab("pending")}
						className={`flex-1 py-4 text-sm font-bold font-(family-name:--font-dmsans) transition-all border-b-2 ${
							activeTab === "pending"
								? "text-[#556b2f] border-[#556b2f]"
								: "text-gray-400 border-transparent hover:text-gray-600"
						}`}
					>
						Pending ({pendingParticipants.length})
					</button>
					<button
						onClick={() => setActiveTab("accepted")}
						className={`flex-1 py-4 text-sm font-bold font-(family-name:--font-dmsans) transition-all border-b-2 ${
							activeTab === "accepted"
								? "text-[#556b2f] border-[#556b2f]"
								: "text-gray-400 border-transparent hover:text-gray-600"
						}`}
					>
						Accepted ({acceptedParticipants.length})
					</button>
				</div>

				{/* Content */}
				<div className="p-8 overflow-y-auto min-h-[300px]">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-48 gap-3">
							<div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-100 border-t-[#556b2f]"></div>
							<p className="text-gray-400 text-sm font-medium font-(family-name:--font-dmsans)">Loading participants...</p>
						</div>
					) : activeTab === "pending" ? (
						pendingParticipants.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
								<div className="p-4 bg-gray-50 rounded-full">
									<IconUsers size={32} className="opacity-50" />
								</div>
								<p className="font-medium font-(family-name:--font-dmsans)">No pending requests</p>
							</div>
						) : (
							<div className="space-y-4">
								{pendingParticipants.map((p) => (
									<div
										key={p.id}
										className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#556b2f]/20 transition-all"
									>
										<div>
											<p className="font-bold text-gray-900 font-(family-name:--font-dmsans)">{p.username}</p>
											<p className="text-sm text-gray-500 font-(family-name:--font-dmsans)">{p.email}</p>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => handleAccept(p.id)}
												disabled={actionLoading === p.id}
												className="p-2.5 bg-[#556b2f]/10 text-[#556b2f] rounded-xl hover:bg-[#556b2f] hover:text-white transition-all disabled:opacity-50"
												title="Accept"
											>
												{actionLoading === p.id ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" /> : <IconCheck size={20} stroke={2.5} />}
											</button>
											<button
												onClick={() => handleDeny(p.id)}
												disabled={actionLoading === p.id}
												className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
												title="Deny"
											>
												{actionLoading === p.id ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" /> : <IconX size={20} stroke={2.5} />}
											</button>
										</div>
									</div>
								))}
							</div>
						)
					) : acceptedParticipants.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
							<div className="p-4 bg-gray-50 rounded-full">
								<IconUsers size={32} className="opacity-50" />
							</div>
							<p className="font-medium font-(family-name:--font-dmsans)">No accepted participants yet</p>
						</div>
					) : (
						<div className="space-y-4">
							{acceptedParticipants.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-all"
								>
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-full bg-[#556b2f]/10 flex items-center justify-center text-[#556b2f] font-bold font-(family-name:--font-crimson)">
											{p.username.charAt(0).toUpperCase()}
										</div>
										<div>
											<p className="font-bold text-gray-900 font-(family-name:--font-dmsans)">{p.username}</p>
											<p className="text-sm text-gray-500 font-(family-name:--font-dmsans)">{p.email}</p>
										</div>
									</div>
									<span className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-bold font-(family-name:--font-dmsans) flex items-center gap-1.5">
										<IconCheck size={14} stroke={3} />
										Going
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function MyEvents() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<"joined" | "pending" | "hosted">("joined");
	const [joinedSubTab, setJoinedSubTab] = useState<"past" | "ongoing" | "going">("going");
	const [joinedEvents, setJoinedEvents] = useState<EventUser[]>([]);
	const [pendingEvents, setPendingEvents] = useState<EventUser[]>([]);
	const [hostedEvents, setHostedEvents] = useState<HostedEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedEvent, setSelectedEvent] = useState<HostedEvent | null>(null);

	// role may be a string or an object like { id, name }
	const rawRole = user?.role;
	const roleName = typeof rawRole === "string" ? rawRole : (rawRole as { name?: string } | undefined)?.name ?? "";
	const isHost = roleName === "HOST" || roleName === "ADMIN";
	
	useEffect(() => {
		if (user?.id) {
			fetchMyEvents();
		}
	}, [user?.id]);

	const fetchMyEvents = async () => {
		if (!user?.id) return;

		try {
			const [joinedResult, pendingResult] = await Promise.all([
				RestClient.getJoinedEvents(user.id),
				RestClient.getPendingEvents(user.id),
			]);

			if (joinedResult.data) setJoinedEvents(joinedResult.data);
			if (pendingResult.data) setPendingEvents(pendingResult.data);

			// Fetch hosted events if user is a host
			if (isHost) {
				const hostedResult = await RestClient.getHostedEvents(user.id);
				if (hostedResult.data) setHostedEvents(hostedResult.data);
			}
		} catch (err) {
			console.error("Failed to fetch events:", err);
		} finally {
			setLoading(false);
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-[#fcfdfa] pt-32 pb-20">
				<div className="max-w-4xl mx-auto px-4 text-center">
					<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<IconUsers size={32} className="text-gray-400" />
					</div>
					<h1 className="text-3xl font-bold font-(family-name:--font-crimson) text-gray-900 mb-4">Please Log In</h1>
					<p className="text-gray-600 font-(family-name:--font-dmsans)">You need to be logged in to view your events.</p>
					
					<Link to="/login" className="inline-block mt-8 px-8 py-3 bg-[#556b2f] text-white rounded-xl font-bold font-(family-name:--font-dmsans) hover:bg-[#6d8c3a] transition-all">
						Login Now
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#fcfdfa] pt-28 pb-20">
			<div className="max-w-5xl mx-auto px-6">
				{/* Header */}
				<div className="mb-10">
					<h1 className="font-(family-name:--font-crimson) text-5xl font-bold text-gray-900 mb-3 tracking-tight">
						My Events
					</h1>
					<p className="text-gray-500 text-lg font-(family-name:--font-dmsans)">
						Manage your event registrations and track your volunteer journey
					</p>
				</div>

				{/* Main Tabs */}
				<div className="flex items-center gap-8 mb-10 border-b border-gray-200">
					<button
						onClick={() => setActiveTab("joined")}
						className={`pb-4 text-lg font-bold font-(family-name:--font-dmsans) transition-all relative ${
							activeTab === "joined"
								? "text-[#556b2f]"
								: "text-gray-400 hover:text-gray-600"
						}`}
					>
						Joined Events
						<span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs align-middle ${
							activeTab === "joined" ? "bg-[#556b2f]/10 text-[#556b2f]" : "bg-gray-100 text-gray-500"
						}`}>
							{joinedEvents.length}
						</span>
						{activeTab === "joined" && (
							<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-t-full" />
						)}
					</button>

					<button
						onClick={() => setActiveTab("pending")}
						className={`pb-4 text-lg font-bold font-(family-name:--font-dmsans) transition-all relative ${
							activeTab === "pending"
								? "text-[#556b2f]"
								: "text-gray-400 hover:text-gray-600"
						}`}
					>
						Pending
						<span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs align-middle ${
							activeTab === "pending" ? "bg-[#556b2f]/10 text-[#556b2f]" : "bg-gray-100 text-gray-500"
						}`}>
							{pendingEvents.length}
						</span>
						{activeTab === "pending" && (
							<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-t-full" />
						)}
					</button>

					{isHost && (
						<button
							onClick={() => setActiveTab("hosted")}
							className={`pb-4 text-lg font-bold font-(family-name:--font-dmsans) transition-all relative ${
								activeTab === "hosted"
									? "text-[#556b2f]"
									: "text-gray-400 hover:text-gray-600"
							}`}
						>
							Hosted Events
							<span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs align-middle ${
								activeTab === "hosted" ? "bg-[#556b2f]/10 text-[#556b2f]" : "bg-gray-100 text-gray-500"
							}`}>
								{hostedEvents.length}
							</span>
							{activeTab === "hosted" && (
								<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-t-full" />
							)}
						</button>
					)}
				</div>

				{/* Content */}
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24">
						<div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-[#556b2f] mb-4"></div>
						<p className="text-gray-500 font-medium font-(family-name:--font-dmsans)">Loading your events...</p>
					</div>
				) : (
					<div className="space-y-6">
						{activeTab === "joined" && (
							<>
								{/* Sub-tabs for joined events */}
								<div className="flex flex-wrap gap-2 mb-8">
									{[
										{ id: "going", label: "Upcoming", icon: <IconCalendarEvent size={18} /> },
										{ id: "ongoing", label: "In Progress", icon: <IconPlayerPlay size={18} /> },
										{ id: "past", label: "Completed", icon: <IconHistory size={18} /> }
									].map((tab) => (
										<button
											key={tab.id}
											onClick={() => setJoinedSubTab(tab.id as any)}
											className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold font-(family-name:--font-dmsans) transition-all ${
												joinedSubTab === tab.id
													? "bg-[#556b2f] text-white shadow-lg shadow-[#556b2f]/20"
													: "bg-white text-gray-600 border border-gray-200 hover:border-[#556b2f]/50 hover:text-[#556b2f]"
											}`}
										>
											{tab.icon}
											{tab.label}
										</button>
									))}
								</div>

								{/* Filter events based on selected sub-tab */}
								{(() => {
									const now = new Date();
									const filteredEvents = joinedEvents.filter(e => {
										const start = new Date(e.eventStartTime);
										const end = new Date(e.eventEndTime);
										if (joinedSubTab === "past") return end < now;
										if (joinedSubTab === "ongoing") return start <= now && end >= now;
										if (joinedSubTab === "going") return start > now;
										return true;
									});

									if (filteredEvents.length === 0) {
										return (
											<div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
												<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
													{joinedSubTab === "past" ? <IconHistory size={32} /> : <IconCalendarEvent size={32} />}
												</div>
												<h3 className="text-xl font-bold text-gray-900 font-(family-name:--font-crimson) mb-2">
													{joinedSubTab === "past" ? "No Past Events" 
														: joinedSubTab === "ongoing" ? "No Ongoing Events" 
														: "No Upcoming Events"}
												</h3>
												<p className="text-gray-500 font-(family-name:--font-dmsans) max-w-sm text-center mb-6">
													{joinedSubTab === "past" ? "You haven't completed any events yet. Your history will appear here." 
														: joinedSubTab === "ongoing" ? "You are not currently participating in any active events." 
														: "You haven't joined any upcoming events yet. Browse events to get started!"}
												</p>
												{joinedSubTab === "going" && (
													<Link
														to="/events"
														className="px-6 py-2.5 bg-[#556b2f] text-white rounded-xl font-bold font-(family-name:--font-dmsans) hover:bg-[#6d8c3a] transition-all shadow-lg shadow-[#556b2f]/20 hover:shadow-xl hover:shadow-[#556b2f]/30"
													>
														Browse Available Events
													</Link>
												)}
											</div>
										);
									}

									return (
										<div className="grid grid-cols-1 gap-6">
											{filteredEvents.map((event) => (
												<EventCard key={event.id} event={event} type="joined" subType={joinedSubTab} />
											))}
										</div>
									);
								})()}
							</>
						)}

						{activeTab === "pending" && (
							<>
								{pendingEvents.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
										<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
											<IconClock size={32} />
										</div>
										<h3 className="text-xl font-bold text-gray-900 font-(family-name:--font-crimson) mb-2">
											No Pending Requests
										</h3>
										<p className="text-gray-500 font-(family-name:--font-dmsans)">
											You don't have any pending event requests at the moment.
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 gap-6">
										{pendingEvents.map((event) => (
											<EventCard key={event.id} event={event} type="pending" />
										))}
									</div>
								)}
							</>
						)}

						{activeTab === "hosted" && isHost && (
							<>
								{hostedEvents.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
										<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
											<IconUsers size={32} />
										</div>
										<h3 className="text-xl font-bold text-gray-900 font-(family-name:--font-crimson) mb-2">
											No Hosted Events
										</h3>
										<p className="text-gray-500 font-(family-name:--font-dmsans) mb-6">
											You haven't hosted any events yet. Start making an impact today!
										</p>
										<Link
											to="/events"
											className="px-6 py-2.5 bg-[#556b2f] text-white rounded-xl font-bold font-(family-name:--font-dmsans) hover:bg-[#6d8c3a] transition-all"
										>
											Create an Event
										</Link>
									</div>
								) : (
									<div className="grid grid-cols-1 gap-6">
										{hostedEvents.map((event) => (
											<EventCard
												key={event.id}
												event={event}
												type="hosted"
												onManage={() => setSelectedEvent(event)}
											/>
										))}
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>

			{/* Participant Management Modal */}
			{selectedEvent && (
				<ParticipantModal
					event={selectedEvent}
					onClose={() => setSelectedEvent(null)}
				/>
			)}
		</div>
	);
}
