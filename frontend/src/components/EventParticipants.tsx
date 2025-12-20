import { useState, useEffect } from "react";
import { IconCheck, IconX, IconUsers, IconClock, IconCheckbox, IconSquare, IconSquareCheck } from "@tabler/icons-react";
import { RestClient } from "../api/RestClient";
import { useToast } from "./ui/Toast";

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

interface EventParticipantsProps {
	eventId: number;
	isHost: boolean;
	startTime?: string;
	endTime?: string;
}

export default function EventParticipants({ eventId, isHost, startTime, endTime }: EventParticipantsProps) {
	const [activeTab, setActiveTab] = useState<"accepted" | "pending">("accepted");
	const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
	const [acceptedParticipants, setAcceptedParticipants] = useState<Participant[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [attendanceLoading, setAttendanceLoading] = useState<number | null>(null);
	const { showToast } = useToast();

	// Determine event status based on start and end times
	const now = new Date();
	const eventStartTime = startTime ? new Date(startTime) : null;
	const eventEndTime = endTime ? new Date(endTime) : null;
	
	const isPastEvent = eventEndTime ? eventEndTime < now : false;
	const isOngoingEvent = eventStartTime && eventEndTime 
		? (eventStartTime <= now && eventEndTime >= now) 
		: false;
	const showAttendanceChecklist = isHost && (isPastEvent || isOngoingEvent);

	useEffect(() => {
		fetchParticipants();
	}, [eventId]);

	const fetchParticipants = async () => {
		try {
			const [pendingResult, acceptedResult] = await Promise.all([
				RestClient.getPendingParticipants(eventId),
				RestClient.getAcceptedParticipants(eventId),
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
			showToast("Participant accepted successfully!", "success");
			fetchParticipants();
		} catch (err) {
			console.error("Failed to accept user:", err);
			showToast("Failed to accept participant", "error");
		} finally {
			setActionLoading(null);
		}
	};

	const handleDeny = async (eventUserId: number) => {
		setActionLoading(eventUserId);
		try {
			await RestClient.denyUserToEvent(eventUserId);
			showToast("Participant request denied", "success");
			fetchParticipants();
		} catch (err) {
			console.error("Failed to deny user:", err);
			showToast("Failed to deny participant", "error");
		} finally {
			setActionLoading(null);
		}
	};

	const handleToggleAttendance = async (participant: Participant) => {
		setAttendanceLoading(participant.id);
		try {
			const newCompleted = !participant.completed;
			await RestClient.markParticipantAttendance(participant.id, newCompleted);
			
			// Update local state
			setAcceptedParticipants(prev => 
				prev.map(p => 
					p.id === participant.id 
						? { ...p, completed: newCompleted } 
						: p
				)
			);
			
			showToast(
				newCompleted 
					? `${participant.username} marked as attended` 
					: `${participant.username} marked as absent`,
				"success"
			);
		} catch (err) {
			console.error("Failed to update attendance:", err);
			showToast("Failed to update attendance", "error");
		} finally {
			setAttendanceLoading(null);
		}
	};

	if (loading) {
		return (
			<div className="text-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#556b2f] mx-auto"></div>
				<p className="text-gray-600 mt-2">Loading participants...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats Summary */}
			<div className="grid grid-cols-2 gap-4">
				<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
					<div className="p-2 bg-green-100 rounded-lg">
						<IconUsers size={24} className="text-green-600" />
					</div>
					<div>
						<p className="text-2xl font-bold text-green-700">{acceptedParticipants.length}</p>
						<p className="text-sm text-green-600">Accepted</p>
					</div>
				</div>
				<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
					<div className="p-2 bg-yellow-100 rounded-lg">
						<IconClock size={24} className="text-yellow-600" />
					</div>
					<div>
						<p className="text-2xl font-bold text-yellow-700">{pendingParticipants.length}</p>
						<p className="text-sm text-yellow-600">Pending</p>
					</div>
				</div>
			</div>

			{/* Attendance Stats (for past/ongoing events) */}
			{showAttendanceChecklist && acceptedParticipants.length > 0 && (
				<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
					<div className="flex items-center gap-2 mb-2">
						<IconCheckbox size={20} className="text-blue-600" />
						<h3 className="font-semibold text-blue-800">Attendance Tracking</h3>
					</div>
					<p className="text-sm text-blue-700">
						{acceptedParticipants.filter(p => p.completed).length} of {acceptedParticipants.length} participants attended
					</p>
					<div className="mt-2 bg-blue-200 rounded-full h-2 overflow-hidden">
						<div 
							className="h-full bg-blue-600 transition-all duration-300"
							style={{ 
								width: `${acceptedParticipants.length > 0 
									? (acceptedParticipants.filter(p => p.completed).length / acceptedParticipants.length) * 100 
									: 0}%` 
							}}
						></div>
					</div>
				</div>
			)}

			{/* Tabs */}
			<div className="flex border-b border-gray-200">
				<button
					onClick={() => setActiveTab("accepted")}
					className={`flex-1 py-3 text-center font-semibold transition-colors ${
						activeTab === "accepted"
							? "text-[#556b2f] border-b-2 border-[#556b2f]"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Accepted ({acceptedParticipants.length})
				</button>
				<button
					onClick={() => setActiveTab("pending")}
					className={`flex-1 py-3 text-center font-semibold transition-colors ${
						activeTab === "pending"
							? "text-[#556b2f] border-b-2 border-[#556b2f]"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Pending Requests ({pendingParticipants.length})
				</button>
			</div>

			{/* Participants List */}
			<div className="space-y-3">
				{activeTab === "accepted" ? (
					acceptedParticipants.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 rounded-xl">
							<IconUsers size={48} className="mx-auto text-gray-400 mb-3" />
							<p className="text-gray-500">No accepted participants yet</p>
						</div>
					) : (
						acceptedParticipants.map((p) => (
							<div
								key={p.id}
								className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
									showAttendanceChecklist 
										? p.completed 
											? 'bg-green-50 border border-green-200 hover:bg-green-100' 
											: 'bg-gray-50 hover:bg-gray-100'
										: 'bg-gray-50 hover:bg-gray-100'
								}`}
							>
								<div className="flex items-center gap-3">
									{/* Attendance Checkbox - only for past/ongoing events */}
									{showAttendanceChecklist && (
										<button
											onClick={() => handleToggleAttendance(p)}
											disabled={attendanceLoading === p.id}
											className={`p-1 rounded-lg transition-all ${
												attendanceLoading === p.id 
													? 'opacity-50 cursor-wait' 
													: 'hover:bg-gray-200'
											}`}
											title={p.completed ? "Mark as absent" : "Mark as attended"}
										>
											{p.completed ? (
												<IconSquareCheck size={24} className="text-green-600" />
											) : (
												<IconSquare size={24} className="text-gray-400" />
											)}
										</button>
									)}
									<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
										showAttendanceChecklist && p.completed 
											? 'bg-green-200' 
											: 'bg-green-100'
									}`}>
										<span className={`font-semibold ${
											showAttendanceChecklist && p.completed 
												? 'text-green-800' 
												: 'text-green-700'
										}`}>
											{p.username.charAt(0).toUpperCase()}
										</span>
									</div>
									<div>
										<p className="font-medium text-gray-900">{p.username}</p>
										<p className="text-sm text-gray-600">{p.email}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{showAttendanceChecklist && (
										<span className={`px-3 py-1 rounded-full text-sm font-medium ${
											p.completed 
												? 'bg-green-100 text-green-700' 
												: 'bg-gray-200 text-gray-600'
										}`}>
											{p.completed ? 'Attended' : 'Absent'}
										</span>
									)}
									{!showAttendanceChecklist && (
										<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
											Accepted
										</span>
									)}
									{/* Remove button for hosts (only before event ends) */}
									{isHost && !isPastEvent && (
										<button
											onClick={() => {
												if (confirm(`Remove ${p.username} from this event?`)) {
													handleDeny(p.id);
												}
											}}
											disabled={actionLoading === p.id}
											className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
											title="Remove participant"
										>
											<IconX size={16} />
										</button>
									)}
								</div>
							</div>
						))
					)
				) : pendingParticipants.length === 0 ? (
					<div className="text-center py-8 bg-gray-50 rounded-xl">
						<IconClock size={48} className="mx-auto text-gray-400 mb-3" />
						<p className="text-gray-500">No pending requests</p>
					</div>
				) : (
					pendingParticipants.map((p) => (
						<div
							key={p.id}
							className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
									<span className="text-yellow-700 font-semibold">
										{p.username.charAt(0).toUpperCase()}
									</span>
								</div>
								<div>
									<p className="font-medium text-gray-900">{p.username}</p>
									<p className="text-sm text-gray-600">{p.email}</p>
								</div>
							</div>
							{isHost ? (
								<div className="flex gap-2">
									<button
										onClick={() => handleAccept(p.id)}
										disabled={actionLoading === p.id}
										className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
										title="Accept"
									>
										<IconCheck size={20} />
									</button>
									<button
										onClick={() => handleDeny(p.id)}
										disabled={actionLoading === p.id}
										className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
										title="Deny"
									>
										<IconX size={20} />
									</button>
								</div>
							) : (
								<span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
									Pending
								</span>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}
