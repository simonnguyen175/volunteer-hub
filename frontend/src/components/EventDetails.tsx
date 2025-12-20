import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { IconArrowLeft, IconUsers, IconCalendar, IconClock } from "@tabler/icons-react";
import { createClient } from "@supabase/supabase-js";
import { RestClient } from "../api/RestClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/Toast";
import EventDescription from "./EventDescription";
import EventDiscussion from "./EventDiscussion";
import EventParticipants from "./EventParticipants";

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
	const [isJoining, setIsJoining] = useState(false);
	const [registrationStatus, setRegistrationStatus] = useState<{
		isRegistered: boolean;
		isPending: boolean;
		isAccepted: boolean;
	}>({ isRegistered: false, isPending: false, isAccepted: false });

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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556b2f] mx-auto mb-4"></div>
					<p className="text-gray-600">Loading event...</p>
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
						<div className="flex gap-6 border-b-2 border-gray-200">
							<button
							onClick={() => {
								setActiveTab("details");
								navigate(`/events/${eventId}?tab=details`, { replace: true });
							}}
							className={`pb-3 px-2 font-(family-name:--font-dmsans) font-bold transition-all relative ${
								activeTab === "details"
									? "text-[#556b2f] border-b-3 border-[#556b2f] -mb-0.5"
									: "text-gray-500 hover:text-[#556b2f]"
							}`}
						>
							Details
						</button>
						<button
							onClick={() => {
								setActiveTab("discussion");
								navigate(`/events/${eventId}?tab=discussion`, { replace: true });
							}}
							className={`pb-3 px-2 font-(family-name:--font-dmsans) font-bold transition-all relative ${
								activeTab === "discussion"
									? "text-[#556b2f] border-b-3 border-[#556b2f] -mb-0.5"
									: "text-gray-500 hover:text-[#556b2f]"
							}`}
						>
							Discussion
						</button>
						{isHost && (
							<button
								onClick={() => {
									setActiveTab("participants");
									navigate(`/events/${eventId}?tab=participants`, { replace: true });
								}}
								className={`pb-3 px-2 font-(family-name:--font-dmsans) font-bold transition-all relative flex items-center gap-2 ${
									activeTab === "participants"
										? "text-[#556b2f] border-b-3 border-[#556b2f] -mb-0.5"
										: "text-gray-500 hover:text-[#556b2f]"
								}`}
							>
								<IconUsers size={18} />
								Participants
							</button>
						)}
						</div>

						{/* Tab Content */}
						<div className="py-4">
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
										<span className="text-gray-600 font-(family-name:--font-dmsans) text-sm">End Time</span>
										<span className="font-bold text-gray-900 font-(family-name:--font-dmsans) bg-white px-3 py-1 rounded-lg text-sm">
											{formatDateTime(event.endTime).time}
										</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3">
								<button 
									onClick={handleJoinEvent}
									disabled={isJoining || !user || registrationStatus.isRegistered}
									className={`w-full font-(family-name:--font-dmsans) text-white text-lg font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
										registrationStatus.isAccepted 
											? 'bg-[#747e59] hover:bg-[#747e59]'
											: registrationStatus.isPending
											? 'bg-[#8e9c78] hover:bg-[#8e9c78]'
											: 'bg-[#556b2f] hover:bg-[#6d8c3a]'
									}`}
								>
									{isJoining 
										? "Joining..." 
										: registrationStatus.isAccepted 
										? "✓ Already Joined" 
										: registrationStatus.isPending 
										? "⏳ Pending Approval" 
										: user 
										? "Join Event" 
										: "Login to Join"}
								</button>
								{registrationStatus.isAccepted && (
									<button 
										onClick={handleLeaveEvent}
										disabled={isJoining}
										className="w-full font-(family-name:--font-dmsans) text-red-600 bg-white border-2 border-red-600 text-lg font-bold py-4 rounded-xl transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isJoining ? "Leaving..." : "Leave Event"}
									</button>
								)}
							</div>

							{/* Share Section */}
							<div className="bg-gradient-to-br from-[#556b2f]/5 to-[#747e59]/5 p-6 rounded-xl border border-[#556b2f]/20">
								<h4 className="font-(family-name:--font-dmsans) font-bold text-[#556b2f] text-sm uppercase tracking-wide mb-4">
									Share this event
								</h4>
								<div className="flex gap-2">
									<button className="flex-1 bg-white border border-[#556b2f]/30 py-2 px-3 rounded-lg text-xs font-(family-name:--font-dmsans) font-semibold text-gray-700 hover:bg-[#556b2f]/10 hover:border-[#556b2f] transition-all">
										Facebook
									</button>
									<button className="flex-1 bg-white border border-[#556b2f]/30 py-2 px-3 rounded-lg text-xs font-(family-name:--font-dmsans) font-semibold text-gray-700 hover:bg-[#556b2f]/10 hover:border-[#556b2f] transition-all">
										Twitter
									</button>
									<button className="flex-1 bg-white border border-[#556b2f]/30 py-2 px-3 rounded-lg text-xs font-(family-name:--font-dmsans) font-semibold text-gray-700 hover:bg-[#556b2f]/10 hover:border-[#556b2f] transition-all">
										Copy Link
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
