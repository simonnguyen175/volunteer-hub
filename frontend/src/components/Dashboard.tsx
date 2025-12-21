import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
	IconTrophy,
	IconFlame,
	IconUsers,
	IconMessageCircle,
	IconCalendarEvent,
	IconMapPin,
} from "@tabler/icons-react";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { RestClient } from "@/api/RestClient";

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
	managerName?: string;
}

interface DashboardProps {
	isEmbedded?: boolean;
}

export default function Dashboard({ isEmbedded = false }: DashboardProps) {
	const [topEvents, setTopEvents] = useState<(Event & { fullImageUrl: string })[]>([]);
	const [hottestEvents, setHottestEvents] = useState<(Event & { fullImageUrl: string })[]>([]);
	const [loading, setLoading] = useState(true);

	// Helper function to get Supabase public URL for event images
	const getSupabaseImageUrl = (imageUrl: string): string => {
		if (!imageUrl) return "";
		if (imageUrl.startsWith("http")) return imageUrl;
		const { data } = supabase.storage.from("volunteer").getPublicUrl(imageUrl);
		return data?.publicUrl || "";
	};

	// Helper function to format datetime for display
	const formatDateTime = (datetime: string) => {
		const date = new Date(datetime);
		const dateStr = date.toLocaleDateString('en-GB');
		const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
		return { dateStr, timeStr };
	};

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch top events and hottest events in parallel
				const [topResult, hottestResult] = await Promise.all([
					RestClient.getTopEvents(6),
					RestClient.getHottestEvents(6),
				]);

				if (topResult.data) {
					const eventsWithImages = topResult.data.map((event: Event) => ({
						...event,
						fullImageUrl: getSupabaseImageUrl(event.imageUrl),
					}));
					setTopEvents(eventsWithImages);
				}

				if (hottestResult.data) {
					const eventsWithImages = hottestResult.data.map((event: Event) => ({
						...event,
						fullImageUrl: getSupabaseImageUrl(event.imageUrl),
					}));
					setHottestEvents(eventsWithImages);
				}
			} catch (err) {
				console.error("Failed to fetch dashboard data:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	const EventCard = ({ event, index, badge }: { event: Event & { fullImageUrl: string }; index: number; badge?: React.ReactNode }) => {
		const { dateStr: startDate, timeStr: startTimeStr } = formatDateTime(event.startTime);

		return (
			<Link
				key={event.id}
				to={`/events/${event.id}`}
				style={{ animation: `fadeInUp 0.4s ease-out ${index * 50}ms both` }}
			>
				<Card className="group relative overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full">
					{badge && (
						<div className="absolute top-3 left-3 z-20">
							{badge}
						</div>
					)}
					<div className="aspect-video w-full overflow-hidden">
						<img
							src={event.fullImageUrl}
							alt={event.title}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
					</div>
					<div className="relative">
						<div className="relative z-10 p-4 bg-white group-hover:bg-transparent transition-colors">
							<CardHeader className="p-0 space-y-2">
								<div className="flex items-center gap-2 text-xs text-gray-500 font-(family-name:--font-dmsans)">
									<span className="px-2 py-0.5 bg-[#556b2f]/10 text-[#556b2f] rounded-full font-medium">
										{event.type}
									</span>
								</div>
								<CardTitle className="font-(family-name:--font-crimson) text-xl text-gray-900 group-hover:text-white transition-colors line-clamp-2">
									{event.title}
								</CardTitle>
								<CardDescription className="font-(family-name:--font-dmsans) text-sm text-gray-600 group-hover:text-white/90 transition-colors flex items-center gap-1">
									<IconCalendarEvent size={14} className="shrink-0" />
									{startDate} {startTimeStr}
								</CardDescription>
								<CardDescription className="font-(family-name:--font-dmsans) text-sm text-gray-600 group-hover:text-white/90 transition-colors flex items-center gap-1">
									<IconMapPin size={14} className="shrink-0" />
									<span className="truncate">{event.location}</span>
								</CardDescription>
							</CardHeader>
						</div>
						<div className="absolute bottom-0 left-0 w-full h-[130%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-[#556b2f] via-[#556b2f]/85 to-transparent p-4 z-0" />
					</div>
				</Card>
			</Link>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white pt-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-[#556b2f]"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={isEmbedded ? "" : "min-h-screen bg-gradient-to-b from-white to-gray-50"}>
			{/* Hero Section - only show when not embedded */}
			{!isEmbedded && (
				<div className="relative pt-24 pb-12 bg-gradient-to-br from-[#556b2f]/5 via-white to-[#747e59]/5">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center">
							<h1 className="font-(family-name:--font-crimson) font-medium text-[4rem] sm:text-[5rem] text-gray-900 mb-4 leading-tight">
								Dashboard
								<span className="text-[#556b2f]">.</span>
							</h1>
							<p className="font-(family-name:--font-dmsans) text-lg text-gray-600 max-w-2xl mx-auto">
								Discover the most popular volunteer events and hottest discussions in our community
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
				{/* Top Events Section */}
				<section>
					<div className="flex items-center gap-3 mb-8">
						<div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
							<IconTrophy size={28} className="text-white" />
						</div>
						<div>
							<h2 className="font-(family-name:--font-crimson) text-3xl font-bold text-gray-900 flex items-center gap-2">
								Top Events
								<IconUsers size={24} className="text-amber-500" />
							</h2>
							<p className="font-(family-name:--font-dmsans) text-gray-500 text-sm">
								Events with the most participants
							</p>
						</div>
					</div>

					{topEvents.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{topEvents.map((event, index) => (
								<EventCard
									key={event.id}
									event={event}
									index={index}
									badge={
										index < 3 && (
											<div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shadow-md ${
												index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white' :
												index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
												'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
											}`}>
												<IconTrophy size={14} />
												#{index + 1}
											</div>
										)
									}
								/>
							))}
						</div>
					) : (
						<div className="bg-gray-50 rounded-2xl p-12 text-center">
							<IconUsers size={48} className="text-gray-300 mx-auto mb-4" />
							<p className="font-(family-name:--font-dmsans) text-gray-500">
								No events with participants yet. Be the first to join!
							</p>
						</div>
					)}
				</section>

				{/* Hottest Events Section */}
				<section>
					<div className="flex items-center gap-3 mb-8">
						<div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-200">
							<IconFlame size={28} className="text-white" />
						</div>
						<div>
							<h2 className="font-(family-name:--font-crimson) text-3xl font-bold text-gray-900 flex items-center gap-2">
								Hottest Events
								<IconMessageCircle size={24} className="text-red-500" />
							</h2>
							<p className="font-(family-name:--font-dmsans) text-gray-500 text-sm">
								Events with the most active discussions
							</p>
						</div>
					</div>

					{hottestEvents.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{hottestEvents.map((event, index) => (
								<EventCard
									key={event.id}
									event={event}
									index={index}
									badge={
										index < 3 && (
											<div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shadow-md ${
												index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
												index === 1 ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white' :
												'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
											}`}>
												<IconFlame size={14} />
												#{index + 1}
											</div>
										)
									}
								/>
							))}
						</div>
					) : (
						<div className="bg-gray-50 rounded-2xl p-12 text-center">
							<IconMessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
							<p className="font-(family-name:--font-dmsans) text-gray-500">
								No discussions yet. Start a conversation!
							</p>
						</div>
					)}
				</section>
			</div>

			{/* Keyframes for animation */}
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
