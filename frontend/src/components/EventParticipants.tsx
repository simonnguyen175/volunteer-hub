import { useState, useEffect } from "react";
import { IconCheck, IconX, IconUsers, IconClock, IconSquare, IconSquareCheck } from "@tabler/icons-react";
import { RestClient } from "../api/RestClient";
import { useToast } from "./ui/Toast";
import { useConfirmDialog } from "./ui/ConfirmDialog";

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
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();

	// Determine event status
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
			showToast("Participant accepted!", "success");
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
			showToast("Request denied", "success");
			fetchParticipants();
		} catch (err) {
			console.error("Failed to deny user:", err);
			showToast("Failed to deny participant", "error");
		} finally {
			setActionLoading(null);
		}
	};

	const handleRemoveParticipant = async (participant: Participant) => {
		const confirmed = await confirm({
			title: "Remove Participant",
			message: `Are you sure you want to remove ${participant.username} from this event?`,
			confirmText: "Remove",
			cancelText: "Cancel",
			variant: "danger",
		});

		if (!confirmed) return;
		handleDeny(participant.id);
	};

	const handleToggleAttendance = async (participant: Participant) => {
		setAttendanceLoading(participant.id);
		try {
			const newCompleted = !participant.completed;
			await RestClient.markParticipantAttendance(participant.id, newCompleted);
			
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

	const attendancePercentage = acceptedParticipants.length > 0 
		? (acceptedParticipants.filter(p => p.completed).length / acceptedParticipants.length) * 100 
		: 0;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-2 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease-out' }}>
			{/* Stats Summary - Simple design */}
			<div className="grid grid-cols-2 gap-4">
				<div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
					<div className="p-2 bg-emerald-100 rounded-lg">
						<IconUsers size={20} className="text-emerald-600" />
					</div>
					<div>
						<p className="text-2xl font-bold text-emerald-700 font-(family-name:--font-crimson)">{acceptedParticipants.length}</p>
						<p className="text-xs font-medium text-emerald-600 font-(family-name:--font-dmsans)">Accepted</p>
					</div>
				</div>
				<div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
					<div className="p-2 bg-amber-100 rounded-lg">
						<IconClock size={20} className="text-amber-600" />
					</div>
					<div>
						<p className="text-2xl font-bold text-amber-700 font-(family-name:--font-crimson)">{pendingParticipants.length}</p>
						<p className="text-xs font-medium text-amber-600 font-(family-name:--font-dmsans)">Pending</p>
					</div>
				</div>
			</div>

			{/* Attendance Progress - Clean bar */}
			{showAttendanceChecklist && acceptedParticipants.length > 0 && (
				<div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
					<div className="flex items-center justify-between mb-3">
						<p className="text-sm font-semibold text-blue-800 font-(family-name:--font-dmsans)">
							Attendance
						</p>
						<p className="text-sm font-bold text-blue-700 font-(family-name:--font-dmsans)">
							{acceptedParticipants.filter(p => p.completed).length} / {acceptedParticipants.length}
						</p>
					</div>
					<div className="h-2 bg-blue-100 rounded-full overflow-hidden">
						<div 
							className="h-full bg-blue-500 rounded-full transition-all duration-500"
							style={{ width: `${attendancePercentage}%` }}
						></div>
					</div>
				</div>
			)}

			{/* Tabs - Simple underline style */}
			<div className="flex border-b border-gray-200">
				<button
					onClick={() => setActiveTab("accepted")}
					className={`flex-1 py-3 text-sm font-semibold font-(family-name:--font-dmsans) transition-colors cursor-pointer ${
						activeTab === "accepted"
							? "text-[#556b2f] border-b-2 border-[#556b2f]"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Accepted ({acceptedParticipants.length})
				</button>
				<button
					onClick={() => setActiveTab("pending")}
					className={`flex-1 py-3 text-sm font-semibold font-(family-name:--font-dmsans) transition-colors cursor-pointer ${
						activeTab === "pending"
							? "text-[#556b2f] border-b-2 border-[#556b2f]"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Pending ({pendingParticipants.length})
				</button>
			</div>

			{/* Participants List */}
			<div className="space-y-2">
				{activeTab === "accepted" ? (
					acceptedParticipants.length === 0 ? (
						<div className="text-center py-10 text-gray-500 font-(family-name:--font-dmsans)">
							<IconUsers size={40} className="mx-auto mb-3 text-gray-300" />
							<p>No accepted participants yet</p>
						</div>
					) : (
						acceptedParticipants.map((p, index) => (
							<div
								key={p.id}
								className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
									showAttendanceChecklist && p.completed 
										? 'bg-emerald-50 border border-emerald-100' 
										: 'bg-gray-50 hover:bg-gray-100'
								}`}
								style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
							>
								<div className="flex items-center gap-3">
									{/* Attendance Checkbox */}
									{showAttendanceChecklist && (
										<button
											onClick={() => handleToggleAttendance(p)}
											disabled={attendanceLoading === p.id}
											className="p-1 rounded hover:bg-white/50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
										>
											{p.completed ? (
												<IconSquareCheck size={22} className="text-emerald-600" />
											) : (
												<IconSquare size={22} className="text-gray-400" />
											)}
										</button>
									)}

									{/* Avatar */}
									<div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
										showAttendanceChecklist && p.completed 
											? 'bg-emerald-500' 
											: 'bg-[#556b2f]'
									}`}>
										{p.username.charAt(0).toUpperCase()}
									</div>

									{/* User Info */}
									<div>
										<p className="font-semibold text-gray-900 font-(family-name:--font-dmsans) text-sm">
											{p.username}
										</p>
										<p className="text-xs text-gray-500 font-(family-name:--font-dmsans)">{p.email}</p>
									</div>
								</div>

								{/* Status / Actions */}
								<div className="flex items-center gap-2">
									{showAttendanceChecklist && (
										<span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
											p.completed 
												? 'bg-emerald-100 text-emerald-700' 
												: 'bg-gray-200 text-gray-600'
										}`}>
											{p.completed ? 'Attended' : 'Absent'}
										</span>
									)}
									
									{isHost && !isPastEvent && (
										<button
											onClick={() => handleRemoveParticipant(p)}
											disabled={actionLoading === p.id}
											className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
										>
											<IconX size={16} />
										</button>
									)}
								</div>
							</div>
						))
					)
				) : pendingParticipants.length === 0 ? (
					<div className="text-center py-10 text-gray-500 font-(family-name:--font-dmsans)">
						<IconClock size={40} className="mx-auto mb-3 text-gray-300" />
						<p>No pending requests</p>
					</div>
				) : (
					pendingParticipants.map((p, index) => (
						<div
							key={p.id}
							className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
							style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
									{p.username.charAt(0).toUpperCase()}
								</div>
								<div>
									<p className="font-semibold text-gray-900 font-(family-name:--font-dmsans) text-sm">{p.username}</p>
									<p className="text-xs text-gray-500 font-(family-name:--font-dmsans)">{p.email}</p>
								</div>
							</div>

							{isHost ? (
								<div className="flex gap-2">
									<button
										onClick={() => handleAccept(p.id)}
										disabled={actionLoading === p.id}
										className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
									>
										<IconCheck size={16} />
									</button>
									<button
										onClick={() => handleDeny(p.id)}
										disabled={actionLoading === p.id}
										className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
									>
										<IconX size={16} />
									</button>
								</div>
							) : (
								<span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
									Pending
								</span>
							)}
						</div>
					))
				)}
			</div>

			{/* Simple fade animation */}
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(8px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
			<ConfirmDialogComponent />
		</div>
	);
}
