import { useState, useEffect } from "react";
import { IconCheck, IconX, IconUsers, IconClock } from "@tabler/icons-react";
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
}

export default function EventParticipants({ eventId, isHost }: EventParticipantsProps) {
	const [activeTab, setActiveTab] = useState<"accepted" | "pending">("accepted");
	const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
	const [acceptedParticipants, setAcceptedParticipants] = useState<Participant[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const { showToast } = useToast();

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
								className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
										<span className="text-green-700 font-semibold">
											{p.username.charAt(0).toUpperCase()}
										</span>
									</div>
									<div>
										<p className="font-medium text-gray-900">{p.username}</p>
										<p className="text-sm text-gray-600">{p.email}</p>
									</div>
								</div>
								<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
									Accepted
								</span>
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
