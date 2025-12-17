import { useParams, Link } from "react-router";
import { useState } from "react";
import { IconArrowLeft, IconUsers, IconCalendar, IconClock } from "@tabler/icons-react";
import EventDescription from "./EventDescription";
import EventDiscussion from "./EventDiscussion";


const exampleEventsList = [
	{
		id: "beach-cleanup",
		eventName: "Beach Cleanup Drive",
		time: "08:30",
		date: "12/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1679689587683-4147eddacebc?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmVhY2glMjBjbGVhbnxlbnwwfHwwfHx8MA%3D%3D",
		description:
			"Join us for our monthly beach cleanup initiative! We'll be cleaning up the coastline, collecting plastic waste, and making our beaches beautiful again. This is a great opportunity to meet fellow volunteers, enjoy the outdoors, and make a tangible difference in our community. All equipment will be provided including gloves, bags, and refreshments. Perfect for individuals, families, and groups!",
		location: "Sunset Beach Park",
		volunteersJoined: 87,
		volunteersRequired: 150,
		organizer: "Green Ocean Initiative",
		requirements: [
			"Wear comfortable clothing and closed-toe shoes",
			"Bring sunscreen and water bottle",
			"Minimum age: 12 years (under 18 must be accompanied by adult)",
		],
	},
	{
		id: "food-distribution",
		eventName: "Community Food Distribution",
		time: "14:00",
		date: "15/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
		description:
			"Help us distribute food packages to families in need across our community. We partner with local food banks to ensure fresh produce and essential groceries reach those who need them most. Volunteers will help sort, pack, and distribute food items. This is a rewarding experience that directly impacts hundreds of families in our area.",
		location: "Community Center, Downtown",
		volunteersJoined: 45,
		volunteersRequired: 60,
		organizer: "Food For All Foundation",
		requirements: [
			"Ability to lift up to 25 lbs",
			"Commitment for minimum 3 hours",
			"Food handling certification (preferred but not required)",
		],
	},
	{
		id: "tree-planting",
		eventName: "Tree Planting Day",
		time: "07:45",
		date: "18/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
		description:
			"Be part of our mission to plant 1,000 trees this year! Join environmental enthusiasts and community members in our reforestation project. We'll provide all tools, saplings, and training. This hands-on activity is perfect for nature lovers and those wanting to combat climate change at the local level. Watch your contribution grow for years to come!",
		location: "Riverside Park",
		volunteersJoined: 112,
		volunteersRequired: 120,
		organizer: "Green City Coalition",
		requirements: [
			"Wear weather-appropriate outdoor clothing",
			"Bring gardening gloves if you have them",
			"No prior experience needed - training provided",
		],
	},
	{
		id: "elderly-visit",
		eventName: "Elderly Home Visit",
		time: "09:00",
		date: "20/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxkZXJseSUyMGNhcmV8ZW58MHx8MHx8fDA%3D",
		description:
			"Brighten the day of our senior community members! Spend quality time with elderly residents, play games, share stories, and provide companionship. Many residents rarely receive visitors, and your presence can make an incredible difference in their lives. Activities include board games, reading, crafts, and conversation. A heartwarming experience for all involved.",
		location: "Sunshine Retirement Home",
		volunteersJoined: 28,
		volunteersRequired: 40,
		organizer: "Elder Care Volunteers",
		requirements: [
			"Patient and friendly demeanor",
			"Background check required (we'll assist)",
			"Commitment to 2-hour minimum visit",
		],
	},
	{
		id: "blood-donation",
		eventName: "Blood Donation Camp",
		time: "10:30",
		date: "22/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1615461066159-fea0960485d5?q=80&w=2216&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		description:
			"Save lives by donating blood or volunteering at our blood donation camp! Whether you're donating or helping with registration, refreshments, and donor care, you'll be part of a life-saving mission. Each donation can save up to three lives. Medical staff will be present throughout the event to ensure safety and comfort for all donors.",
		location: "City Hospital, Main Hall",
		volunteersJoined: 54,
		volunteersRequired: 80,
		organizer: "Red Cross Society",
		requirements: [
			"Donors: Age 18-65, weight over 50kg, healthy condition",
			"Volunteers: Help with registration and donor support",
			"Bring valid ID for donation",
		],
	},
	{
		id: "charity-marathon",
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
		description:
			"Run for a cause! Join our annual charity marathon supporting children's education programs. Choose from 5K, 10K, or half-marathon distances. All proceeds go directly to building schools in underserved communities. Whether you run, walk, or volunteer at water stations, you're making education accessible to children who need it most. Join hundreds of participants in this inspiring event!",
		location: "Central Park - Main Entrance",
		volunteersJoined: 203,
		volunteersRequired: 250,
		organizer: "Run for Education",
		requirements: [
			"Register online before event day",
			"Runners: Complete health waiver",
			"Volunteers: Help at water stations, registration, or finish line",
		],
	},
];

export default function EventDetails() {
	const { eventId } = useParams();
	const event = exampleEventsList.find((e) => e.id === eventId);
	const [activeTab, setActiveTab] = useState<"details" | "discussion">("details");

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

	const progressPercentage = Math.round(
		(event.volunteersJoined / event.volunteersRequired) * 100
	);

	return (
		<div className="min-h-screen bg-white">

			{/* Hero Section with Event Image and Title */}
			<section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
				{/* Background Image */}
				<div className="absolute inset-0">
					<img
						src={event.imageUrl}
						alt={event.eventName}
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
						{event.eventName}
					</h1>

					<div className="flex flex-wrap gap-4 text-white/90 text-lg">
						<div className="flex items-center gap-2">
							<IconCalendar size={20} />
							<span>{event.date}</span>
						</div>
						<div className="flex items-center gap-2">
							<IconClock size={20} />
							<span>{event.time}</span>
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
						<div className="flex gap-4 border-b border-gray-200">
							<button
								onClick={() => setActiveTab("details")}
								className={`pb-3 px-4 font-semibold transition-colors relative ${
									activeTab === "details"
										? "text-[#556b2f] border-b-2 border-[#556b2f]"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								Details
							</button>
							<button
								onClick={() => setActiveTab("discussion")}
								className={`pb-3 px-4 font-semibold transition-colors relative ${
									activeTab === "discussion"
										? "text-[#556b2f] border-b-2 border-[#556b2f]"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								Discussion
							</button>
						</div>

						{/* Tab Content */}
						<div className="py-4">
							{activeTab === "details" ? (
								<EventDescription
									description={event.description}
									requirements={event.requirements}
									organizer={event.organizer}
								/>
							) : (
								<EventDiscussion eventId={event.id} />
							)}
						</div>
					</div>

					{/* Sidebar - Action Buttons and Stats */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-6">
							{/* Volunteer Stats Card */}
							<div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
								<div className="mb-4">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-semibold text-gray-700">
											Volunteers
										</span>
										<span className="text-sm font-semibold text-gray-700">
											{event.volunteersJoined} /{" "}
											{event.volunteersRequired}
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
										<div
											className="bg-[#556b2f] h-full rounded-full transition-all"
											style={{ width: `${progressPercentage}%` }}
										></div>
									</div>
									<p className="text-xs text-gray-500 mt-2">
										{progressPercentage}% filled
									</p>
								</div>

								<div className="space-y-3 pt-4 border-t border-gray-300">
									<div className="flex justify-between">
										<span className="text-gray-600">Joined</span>
										<span className="font-semibold text-gray-900">
											{event.volunteersJoined}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Spots Left</span>
										<span className="font-semibold text-[#556b2f]">
											{event.volunteersRequired -
												event.volunteersJoined}
										</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3">
								<button className="w-full bg-[#556b2f] text-white text-lg font-semibold py-4 rounded-xl hover:bg-[#6d8c3a] transition-colors shadow-lg">
									Join Event
								</button>
							</div>

							{/* Share Section */}
							<div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
								<h4 className="font-semibold mb-3 text-gray-900">
									Share this event
								</h4>
								<div className="flex gap-2">
									<button className="flex-1 bg-white border border-gray-300 py-2 px-3 rounded-lg text-sm hover:bg-gray-100 transition-colors">
										Facebook
									</button>
									<button className="flex-1 bg-white border border-gray-300 py-2 px-3 rounded-lg text-sm hover:bg-gray-100 transition-colors">
										Twitter
									</button>
									<button className="flex-1 bg-white border border-gray-300 py-2 px-3 rounded-lg text-sm hover:bg-gray-100 transition-colors">
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
