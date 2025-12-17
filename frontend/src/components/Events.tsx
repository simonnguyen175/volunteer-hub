import { useState } from "react";
import { Link } from "react-router";

import { IconSearch, IconGridDots, IconList } from "@tabler/icons-react";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";

const exampleEventsList = [
	{
		id: "beach-cleanup",
		eventName: "Beach Cleanup Drive",
		time: "08:30",
		date: "12/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1679689587683-4147eddacebc?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmVhY2glMjBjbGVhbnxlbnwwfHwwfHx8MA%3D%3D",
	},
	{
		id: "food-distribution",
		eventName: "Community Food Distribution",
		time: "14:00",
		date: "15/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
	},
	{
		id: "tree-planting",
		eventName: "Tree Planting Day",
		time: "07:45",
		date: "18/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
	},
	{
		id: "elderly-visit",
		eventName: "Elderly Home Visit",
		time: "09:00",
		date: "20/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxkZXJseSUyMGNhcmV8ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "blood-donation",
		eventName: "Blood Donation Camp",
		time: "10:30",
		date: "22/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1615461066159-fea0960485d5?q=80&w=2216&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		id: "charity-marathon",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon1",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon2",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon3",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon4",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon5",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon6",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon7",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
	{
		id: "charity-marathon8",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
];

export default function Events() {
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	const filteredEvents = exampleEventsList.filter((event) =>
		event.eventName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="min-h-screen bg-gray-50">

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="relative font-(family-name:--font-crimson) font-medium top-10 mb-10 text-[5rem] text-center m-4">
					Our Events.
				</h1>

				{/* Search and View Toggle */}
				<div className="flex items-center gap-4 mb-8">
					<div className="relative flex-1 max-w-md">
						<IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder="Search"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-700"
						/>
					</div>

					<div className="flex items-center gap-2">
						<IconGridDots
							size={22}
							className={
								viewMode === "grid"
									? "text-lime-700"
									: "text-gray-400"
							}
						/>
						<Switch
							checked={viewMode === "list"}
							onCheckedChange={(checked) =>
								setViewMode(checked ? "list" : "grid")
							}
							className="data-[state=checked]:bg-lime-700"
						/>
						<IconList
							size={22}
							className={
								viewMode === "list"
									? "text-lime-700"
									: "text-gray-400"
							}
						/>
					</div>
				</div>

				{/* Events Grid/List Toggle */}
				{viewMode === "grid" ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredEvents.map((event) => (
							<Link key={event.id} to={`/events/${event.id}`}>
								<Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
									<div className="aspect-video w-full overflow-hidden">
										<img
											src={event.imageUrl}
											alt={event.eventName}
											className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
										/>
									</div>

									<CardHeader className="">
										<CardTitle className="font-(family-name:--font-crimson) text-2xl">
											{event.eventName}
										</CardTitle>
										<CardDescription>
											{event.date} at {event.time}
										</CardDescription>
									</CardHeader>
								</Card>
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{filteredEvents.map((event) => (
							<Link key={event.id} to={`/events/${event.id}`}>
								<Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer">
									<div className="flex flex-row">
										<div className="w-64 h-40 shrink-0 overflow-hidden">
											<img
												src={event.imageUrl}
												alt={event.eventName}
												className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
											/>
										</div>

										<div className="flex-1">
											<CardHeader>
												<CardTitle className="font-(family-name:--font-crimson) text-2xl">
													{event.eventName}
												</CardTitle>
												<CardDescription>
													{event.date} at {event.time}
												</CardDescription>
											</CardHeader>
										</div>
									</div>
								</Card>
							</Link>
						))}
					</div>
				)}

				{filteredEvents.length === 0 && (
					<div className="text-center py-12 text-gray-500">
						Found no event matches your search.
					</div>
				)}
			</div>
		</div>
	);
}
