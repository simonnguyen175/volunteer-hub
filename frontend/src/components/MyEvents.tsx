import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	IconCalendarEvent,
	IconClock,
	IconUsers,
	IconCheck,
	IconX,
	IconChevronRight,
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

// Event Card Component
function EventCard({
	event,
	type,
	onManage,
}: {
	event: EventUser | HostedEvent;
	type: "joined" | "pending" | "hosted";
	onManage?: () => void;
}) {
	const isHostedEvent = "managerName" in event;
	const imageUrl = isHostedEvent ? event.imageUrl : (event as EventUser).eventImageUrl;
	const title = isHostedEvent ? event.title : (event as EventUser).eventTitle;
	const eventId = isHostedEvent ? event.id : (event as EventUser).eventId;

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
			<div className="flex">
				<div className="w-32 h-32 flex-shrink-0">
					<img
						src={getSupabaseImageUrl(imageUrl)}
						alt={title}
						className="w-full h-full object-cover"
					/>
				</div>
				<div className="flex-1 p-4">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="font-semibold text-lg text-gray-900">{title}</h3>
							{isHostedEvent && (
								<div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
									<IconCalendarEvent size={16} />
									<span>{formatDateTime(event.startTime).date}</span>
									<IconClock size={16} className="ml-2" />
									<span>{formatDateTime(event.startTime).time}</span>
								</div>
							)}
						</div>
						<span
							className={`px-3 py-1 rounded-full text-xs font-medium ${
								type === "joined"
									? "bg-green-100 text-green-700"
									: type === "pending"
									? "bg-yellow-100 text-yellow-700"
									: "bg-blue-100 text-blue-700"
							}`}
						>
							{type === "joined" ? "Joined" : type === "pending" ? "Pending" : (event as HostedEvent).status}
						</span>
					</div>
					<div className="flex items-center gap-2 mt-3">
						<Link
							to={`/events/${eventId}`}
							className="text-[#556b2f] hover:text-[#6d8c3a] text-sm font-medium flex items-center gap-1"
						>
							View Details
							<IconChevronRight size={16} />
						</Link>
						{type === "hosted" && onManage && (
							<button
								onClick={onManage}
								className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
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
		<div className="fixed inset-0 z-[1000] flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-gray-900">Manage Participants</h2>
						<p className="text-sm text-gray-600">{event.title}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<IconX size={24} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200">
					<button
						onClick={() => setActiveTab("pending")}
						className={`flex-1 py-3 text-center font-medium transition-colors ${
							activeTab === "pending"
								? "text-[#556b2f] border-b-2 border-[#556b2f]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Pending Requests ({pendingParticipants.length})
					</button>
					<button
						onClick={() => setActiveTab("accepted")}
						className={`flex-1 py-3 text-center font-medium transition-colors ${
							activeTab === "accepted"
								? "text-[#556b2f] border-b-2 border-[#556b2f]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Accepted ({acceptedParticipants.length})
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[50vh]">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#556b2f] mx-auto"></div>
						</div>
					) : activeTab === "pending" ? (
						pendingParticipants.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								No pending requests
							</div>
						) : (
							<div className="space-y-3">
								{pendingParticipants.map((p) => (
									<div
										key={p.id}
										className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
									>
										<div>
											<p className="font-medium text-gray-900">{p.username}</p>
											<p className="text-sm text-gray-600">{p.email}</p>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => handleAccept(p.id)}
												disabled={actionLoading === p.id}
												className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
											>
												<IconCheck size={20} />
											</button>
											<button
												onClick={() => handleDeny(p.id)}
												disabled={actionLoading === p.id}
												className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
											>
												<IconX size={20} />
											</button>
										</div>
									</div>
								))}
							</div>
						)
					) : acceptedParticipants.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No accepted participants yet
						</div>
					) : (
						<div className="space-y-3">
							{acceptedParticipants.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
								>
									<div>
										<p className="font-medium text-gray-900">{p.username}</p>
										<p className="text-sm text-gray-600">{p.email}</p>
									</div>
									<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
										Accepted
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
			<div className="min-h-screen bg-gray-50 pt-24">
				<div className="max-w-4xl mx-auto px-4 py-20 text-center">
					<h1 className="text-3xl font-bold mb-4">Please Log In</h1>
					<p className="text-gray-600">You need to be logged in to view your events.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 pt-24">
			<div className="max-w-5xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="font-(family-name:--font-crimson) text-4xl font-bold text-gray-900">
						My Events
					</h1>
					<p className="text-gray-600 mt-2">
						Manage your event registrations and hosted events
					</p>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-8 border-b border-gray-200">
					<button
						onClick={() => setActiveTab("joined")}
						className={`px-6 py-3 font-semibold transition-colors relative ${
							activeTab === "joined"
								? "text-[#556b2f] border-b-2 border-[#556b2f]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Joined Events
						{joinedEvents.length > 0 && (
							<span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
								{joinedEvents.length}
							</span>
						)}
					</button>
					<button
						onClick={() => setActiveTab("pending")}
						className={`px-6 py-3 font-semibold transition-colors relative ${
							activeTab === "pending"
								? "text-[#556b2f] border-b-2 border-[#556b2f]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Pending
						{pendingEvents.length > 0 && (
							<span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
								{pendingEvents.length}
							</span>
						)}
					</button>
					{isHost && (
						<button
							onClick={() => setActiveTab("hosted")}
							className={`px-6 py-3 font-semibold transition-colors relative ${
								activeTab === "hosted"
									? "text-[#556b2f] border-b-2 border-[#556b2f]"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Hosted Events
							{hostedEvents.length > 0 && (
								<span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
									{hostedEvents.length}
								</span>
							)}
						</button>
					)}
				</div>

				{/* Content */}
				{loading ? (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556b2f] mx-auto mb-4"></div>
						<p className="text-gray-600">Loading your events...</p>
					</div>
				) : (
					<div className="space-y-4">
						{activeTab === "joined" && (
							<>
								{joinedEvents.length === 0 ? (
									<div className="text-center py-12 bg-white rounded-xl border border-gray-200">
										<IconCalendarEvent size={48} className="mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											No Joined Events
										</h3>
										<p className="text-gray-600 mb-4">
											You haven't joined any events yet.
										</p>
										<Link
											to="/events"
											className="inline-block px-6 py-2 bg-[#556b2f] text-white rounded-lg hover:bg-[#6d8c3a] transition-colors"
										>
											Browse Events
										</Link>
									</div>
								) : (
									joinedEvents.map((event) => (
										<EventCard key={event.id} event={event} type="joined" />
									))
								)}
							</>
						)}

						{activeTab === "pending" && (
							<>
								{pendingEvents.length === 0 ? (
									<div className="text-center py-12 bg-white rounded-xl border border-gray-200">
										<IconClock size={48} className="mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											No Pending Requests
										</h3>
										<p className="text-gray-600">
											You don't have any pending event requests.
										</p>
									</div>
								) : (
									pendingEvents.map((event) => (
										<EventCard key={event.id} event={event} type="pending" />
									))
								)}
							</>
						)}

						{activeTab === "hosted" && isHost && (
							<>
								{hostedEvents.length === 0 ? (
									<div className="text-center py-12 bg-white rounded-xl border border-gray-200">
										<IconUsers size={48} className="mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											No Hosted Events
										</h3>
										<p className="text-gray-600">
											You haven't hosted any events yet.
										</p>
									</div>
								) : (
									hostedEvents.map((event) => (
										<EventCard
											key={event.id}
											event={event}
											type="hosted"
											onManage={() => setSelectedEvent(event)}
										/>
									))
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
