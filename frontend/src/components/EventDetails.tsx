import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { IconArrowLeft, IconUsers, IconCalendar, IconClock, IconTrash, IconEdit } from "@tabler/icons-react";
import { createClient } from "@supabase/supabase-js";
import { RestClient } from "../api/RestClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/Toast";
import { useConfirmDialog } from "./ui/ConfirmDialog";
import EventDescription from "./EventDescription";
import EventDiscussion from "./EventDiscussion";
import EventParticipants from "./EventParticipants";
import CreateEventModal from "./CreateEventModal";

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
	managerName?: string;
}

const getSupabaseImageUrl = (imagePath: string): string => {
	if (!imagePath) return "";
	const { data } = supabase.storage.from("volunteer").getPublicUrl(imagePath);
	return data.publicUrl;
};

const formatDateTime = (isoString: string) => {
	const date = new Date(isoString);
	return {
		date: date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
		time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
	};
};

export default function EventDetails() {
	const { eventId } = useParams();
	const { user } = useAuth();
	const { showToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const [event, setEvent] = useState<Event | null>(null);
	const [hostName, setHostName] = useState<string>("Loading...");
	const [loading, setLoading] = useState(true);
	const [fullImageUrl, setFullImageUrl] = useState("");
	
	// Initialize tab from URL query params
	const queryParams = new URLSearchParams(location.search);
	const tabFromUrl = queryParams.get('tab') as "details" | "discussion" | "participants" | null;
	const [activeTab, setActiveTab] = useState<"details" | "discussion" | "participants">(tabFromUrl || "details");

	// Check if user is host of this event
	const rawRole = user?.role;
	const roleName = typeof rawRole === "string" ? rawRole : (rawRole as { name?: string } | undefined)?.name ?? "";
	const isHost = event?.managerId === user?.id || roleName === "ADMIN";
	const isEventOwner = event?.managerId === user?.id; // Only the actual owner can delete
	const [isJoining, setIsJoining] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [registrationStatus, setRegistrationStatus] = useState<{
		isRegistered: boolean;
		isPending: boolean;
		isAccepted: boolean;
	}>({ isRegistered: false, isPending: false, isAccepted: false });
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				// Use the get-by-id API which includes host info
				const result = await RestClient.getEventById(parseInt(eventId || "0"));
				if (result.data) {
					setEvent(result.data);
					if (result.data.imageUrl) {
						setFullImageUrl(getSupabaseImageUrl(result.data.imageUrl));
					}
					// Host name is now included in the response
					setHostName(result.data.managerName || "Unknown Host");
				}

				// Check user's registration status if logged in
				if (user?.id) {
					try {
						const statusResult = await RestClient.getUserEventStatus(user.id, parseInt(eventId || "0"));
						console.log("Initial status check result:", statusResult);
						console.log("Status data:", statusResult?.data);
						console.log("Has data?", !!statusResult?.data);
						
						if (statusResult && statusResult.data !== null && statusResult.data !== undefined) {
							console.log("User is registered with status:", statusResult.data.status);
							setRegistrationStatus({
								isRegistered: true,
								isPending: !statusResult.data.status,
								isAccepted: statusResult.data.status
							});
						} else {
							console.log("User is not registered for this event (data is null)");
							// Explicitly set to not registered
							setRegistrationStatus({
								isRegistered: false,
								isPending: false,
								isAccepted: false
							});
						}
					} catch (err) {
						// User not registered, that's fine
						console.log("Error checking status (user likely not registered):", err);
						setRegistrationStatus({
							isRegistered: false,
							isPending: false,
							isAccepted: false
						});
					}
				}
			} catch (err) {
				console.error("Failed to fetch event:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchEvent();
	}, [eventId, user?.id]);

	const handleLeaveEvent = async () => {
		if (!user) return;

		setIsJoining(true);
		try {
			await RestClient.leaveEvent(user.id, parseInt(eventId || "0"));
			setRegistrationStatus({
				isRegistered: false,
				isPending: false,
				isAccepted: false
			});
			showToast("You have left the event.", "success");
		} catch (err) {
			console.error("Failed to leave event:", err);
			showToast("Failed to leave event.", "error");
		} finally {
			setIsJoining(false);
		}
	};

	const handleDeleteEvent = async () => {
		const confirmed = await confirm({
			title: "Delete Event",
			message: "Are you sure you want to delete this event? This action cannot be undone.",
			confirmText: "Delete",
			cancelText: "Cancel",
			variant: "danger",
		});

		if (!confirmed) return;

		setIsDeleting(true);
		try {
			await RestClient.deleteEvent(parseInt(eventId || "0"));
			showToast("Event deleted successfully.", "success");
			navigate("/events");
		} catch (err) {
			console.error("Failed to delete event:", err);
			showToast("Failed to delete event.", "error");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleJoinEvent = async () => {
		if (!user) {
			showToast("Please log in to join events", "warning");
			return;
		}

		setIsJoining(true);
		try {
			const joinResult = await RestClient.joinEvent(user.id, parseInt(eventId || "0"));
			console.log("Join result:", joinResult);
			
			// Small delay to ensure database is updated
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Refetch status from database after successful join
			const statusResult = await RestClient.getUserEventStatus(user.id, parseInt(eventId || "0"));
			console.log("Status result after join:", statusResult);
			
			if (statusResult?.data) {
				console.log("Setting registration status:", {
					isRegistered: true,
					isPending: !statusResult.data.status,
					isAccepted: statusResult.data.status
				});
				setRegistrationStatus({
					isRegistered: true,
					isPending: !statusResult.data.status,
					isAccepted: statusResult.data.status
				});
				showToast("Successfully requested to join event! Wait for approval.", "success");
			} else {
				console.warn("No data in status result, setting default pending state");
				// Fallback: assume pending since we just joined
				setRegistrationStatus({
					isRegistered: true,
					isPending: true,
					isAccepted: false
				});
				showToast("Successfully requested to join event! Wait for approval.", "success");
			}
		} catch (err) {
			console.error("Failed to join event:", err);
			showToast("Failed to join event. You may have already registered.", "error");
		} finally {
			setIsJoining(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
				<div className="flex flex-col items-center">
					<div className="relative mb-6 w-16 h-16">
						<div className="w-16 h-16 border-4 border-[#556b2f]/20 rounded-full"></div>
						<div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-500 font-(family-name:--font-dmsans) font-medium animate-pulse">Loading event...</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="max-w-4xl mx-auto px-4 py-20 text-center">
					<h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
					<Link
						to="/events"
						className="text-[#556b2f] hover:text-[#8e9c78] font-semibold"
					>
						← Back to Events
					</Link>
				</div>
			</div>
		);
	}

	// Determine event status based on time
	const now = new Date();
	const eventStartTime = new Date(event.startTime);
	const eventEndTime = new Date(event.endTime);
	
	const isPastEvent = eventEndTime < now;
	const isOngoingEvent = eventStartTime <= now && eventEndTime >= now;
	const isFutureEvent = eventStartTime > now;

	const { date, time } = formatDateTime(event.startTime);

	return (
		<div className="min-h-screen bg-white">

			{/* Hero Section with Event Image and Title */}
			<section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
				{/* Background Image */}
				<div className="absolute inset-0">
					<img
						src={fullImageUrl}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
					{/* Gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80"></div>
				</div>

				{/* Event Title and Info Overlay */}
				<div className="relative z-10 h-full flex flex-col justify-end px-4 md:px-8 pb-12 max-w-7xl mx-auto">
					<Link
						to="/events"
						className="inline-flex items-center gap-2 text-white hover:text-gray-300 mb-6 w-fit"
					>
						<IconArrowLeft size={20} />
						<span>Back to Events</span>
					</Link>

					<h1 className="font-(family-name:--font-crimson) text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
						{event.title}
					</h1>

					<div className="flex flex-wrap gap-4 text-white/90 text-lg">
						<div className="flex items-center gap-2">
							<IconCalendar size={20} />
							<span>{date}</span>
						</div>
						<div className="flex items-center gap-2">
							<IconClock size={20} />
							<span>{time}</span>
						</div>
						<div className="flex items-center gap-2">
							<IconUsers size={20} />
							<span>{event.location}</span>
						</div>
					</div>
				</div>
			</section>

			{/* Content Section */}
			<section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content - Tabs */}
					<div className="lg:col-span-2 space-y-6">
						{/* Tab Navigation */}
						<div className="flex items-center gap-8 border-b border-gray-100 mb-8">
							<button
								onClick={() => {
									setActiveTab("details");
									navigate(`/events/${eventId}?tab=details`, { replace: true });
								}}
								className={`pb-4 text-sm font-bold tracking-wide font-(family-name:--font-dmsans) transition-all relative cursor-pointer ${
									activeTab === "details"
										? "text-[#556b2f]"
										: "text-gray-400 hover:text-gray-600"
								}`}
							>
								Details
								{activeTab === "details" && (
									<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-full" />
								)}
							</button>
							<button
								onClick={() => {
									setActiveTab("discussion");
									navigate(`/events/${eventId}?tab=discussion`, { replace: true });
								}}
								className={`pb-4 text-sm font-bold tracking-wide font-(family-name:--font-dmsans) transition-all relative cursor-pointer ${
									activeTab === "discussion"
										? "text-[#556b2f]"
										: "text-gray-400 hover:text-gray-600"
								}`}
							>
								Discussion
								{activeTab === "discussion" && (
									<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-full" />
								)}
							</button>
							{isHost && (
								<button
									onClick={() => {
										setActiveTab("participants");
										navigate(`/events/${eventId}?tab=participants`, { replace: true });
									}}
									className={`pb-4 text-sm font-bold tracking-wide font-(family-name:--font-dmsans) transition-all relative flex items-center gap-2 cursor-pointer ${
										activeTab === "participants"
											? "text-[#556b2f]"
											: "text-gray-400 hover:text-gray-600"
									}`}
								>
									Participants
									{activeTab === "participants" && (
										<div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#556b2f] rounded-full" />
									)}
								</button>
							)}
						</div>

						{/* Tab Content */}
						<div className="min-h-[400px]">
							{activeTab === "details" ? (
								<EventDescription
									description={event.description}
									requirements={[]}
									organizer={hostName}
								/>
							) : activeTab === "discussion" ? (
								<EventDiscussion eventId={event.id.toString()} />
							) : (
								<EventParticipants 
								eventId={event.id} 
								isHost={isHost} 
								startTime={event.startTime}
								endTime={event.endTime}
							/>
							)}
						</div>
					</div>

					{/* Sidebar - Action Buttons and Stats */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-6">
							{/* Event Info Card */}
							<div className="bg-gradient-to-br from-[#556b2f]/5 to-[#747e59]/5 p-6 rounded-xl border border-[#556b2f]/20 shadow-sm">
								<h3 className="font-(family-name:--font-dmsans) font-bold text-[#556b2f] text-sm uppercase tracking-wide mb-4">Event Details</h3>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-gray-600 font-(family-name:--font-dmsans) text-sm">Type</span>
										<span className="font-bold text-gray-900 font-(family-name:--font-dmsans) bg-white px-3 py-1 rounded-lg text-sm">
											{event.type}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-600 font-(family-name:--font-dmsans) text-sm">End Date & Time</span>
										<span className="font-bold text-gray-900 font-(family-name:--font-dmsans) bg-white px-3 py-1 rounded-lg text-sm">
											{formatDateTime(event.endTime).date} {formatDateTime(event.endTime).time}
										</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
				<div className="space-y-4">
					{/* Show Edit and Delete buttons for event owner */}
					{isEventOwner ? (
						<div className="space-y-3">
							<button 
								onClick={() => setIsEditModalOpen(true)}
								className="w-full py-3 px-4 rounded-xl border border-[#556b2f] text-[#556b2f] font-bold font-(family-name:--font-dmsans) hover:bg-[#556b2f] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
							>
								<IconEdit size={20} />
								Edit Event
							</button>
							<button 
								onClick={handleDeleteEvent}
								disabled={isDeleting}
								className="w-full py-3 px-4 rounded-xl border border-red-500 text-red-600 font-bold font-(family-name:--font-dmsans) hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
							>
								<IconTrash size={20} />
								{isDeleting ? "Deleting..." : "Delete Event"}
							</button>
						</div>
					) : (
									<div className="space-y-3">
										{/* Hide join button for past events, show for future and ongoing */}
										{!isPastEvent && (
											<button 
												onClick={handleJoinEvent}
												disabled={isJoining || !user || registrationStatus.isRegistered}
												className={`w-full py-3.5 px-4 rounded-xl font-bold font-(family-name:--font-dmsans) text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:cursor-not-allowed cursor-pointer ${
													registrationStatus.isAccepted 
														? 'bg-[#747e59] cursor-default'
														: registrationStatus.isPending
														? 'bg-[#8e9c78] cursor-default'
														: 'bg-[#556b2f] hover:bg-[#6d8c3a]'
												}`}
											>
												{isJoining 
													? "Joining..." 
													: registrationStatus.isAccepted 
													? "✓ You're Going" 
													: registrationStatus.isPending 
													? "⏳ Request Pending" 
													: user 
													? "Join Event" 
													: "Login to Join"}
											</button>
										)}
										{/* Show leave button only for future events (not ongoing or past) */}
										{registrationStatus.isAccepted && isFutureEvent && (
											<button 
												onClick={handleLeaveEvent}
												disabled={isJoining}
												className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold font-(family-name:--font-dmsans) hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all duration-300 disabled:opacity-50 cursor-pointer"
											>
												{isJoining ? "Leaving..." : "Leave Event"}
											</button>
										)}
										{/* Show event status message for past events */}
										{isPastEvent && (
											<div className="w-full text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
												<p className="text-gray-500 font-(family-name:--font-dmsans) text-sm font-medium">This event has ended</p>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Share Section - Minimal */}
							<div className="pt-6 border-t border-gray-100">
								<h4 className="font-(family-name:--font-dmsans) font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">
									Share
								</h4>
								<div className="flex gap-2">
									<button className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold font-(family-name:--font-dmsans) transition-colors cursor-pointer">
										Facebook
									</button>
									<button className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold font-(family-name:--font-dmsans) transition-colors cursor-pointer">
										Twitter
									</button>
									<button className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold font-(family-name:--font-dmsans) transition-colors cursor-pointer">
										Link
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Edit Event Modal */}
			{event && (
				<CreateEventModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					onEventCreated={async () => {
						// Refetch event data
						const result = await RestClient.getEventById(parseInt(eventId || "0"));
						if (result.data) {
							setEvent(result.data);
							if (result.data.imageUrl) {
								setFullImageUrl(getSupabaseImageUrl(result.data.imageUrl));
							}
						}
					}}
					editMode={true}
					initialEventData={{
						id: event.id,
						type: event.type,
						title: event.title,
						startTime: event.startTime,
						endTime: event.endTime,
						location: event.location,
						description: event.description,
						imageUrl: event.imageUrl,
					}}
				/>
			)}

			{/* Animation keyframes */}
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
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
