import mainImg from "../assets/hands-unite.avif";
import { IconArrowUpRight, IconHeart, IconUsers, IconCalendar } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const exampleEventsList = [
	{
		eventName: "Beach Cleanup Drive",
		time: "08:30",
		date: "12/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1679689587683-4147eddacebc?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmVhY2glMjBjbGVhbnxlbnwwfHwwfHx8MA%3D%3D",
	},
	{
		eventName: "Community Food Distribution",
		time: "14:00",
		date: "15/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
	},
	{
		eventName: "Tree Planting Day",
		time: "07:45",
		date: "18/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
	},
	{
		eventName: "Elderly Home Visit",
		time: "09:00",
		date: "20/12/2025",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663036976879-4baf18adfd5b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxkZXJseSUyMGNhcmV8ZW58MHx8MHx8fDA%3D",
	},
	{
		eventName: "Blood Donation Camp",
		time: "10:30",
		date: "22/12/2025",
		imageUrl:
			"https://images.unsplash.com/photo-1615461066159-fea0960485d5?q=80&w=2216&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		eventName: "Charity Marathon",
		time: "06:00",
		date: "05/01/2026",
		imageUrl:
			"https://plus.unsplash.com/premium_photo-1663090417989-b399378d45ac?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFyYXRob258ZW58MHx8MHx8fDA%3D",
	},
];

// Scroll animation hook
function useScrollAnimation() {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
				}
			},
			{
				threshold: 0.1,
			}
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => {
			if (ref.current) {
				observer.unobserve(ref.current);
			}
		};
	}, []);

	return { ref, isVisible };
}

export default function LandingPage() {
	const hero = useScrollAnimation();
	const stats = useScrollAnimation();
	const mission = useScrollAnimation();
	const events = useScrollAnimation();
	const cta = useScrollAnimation();

	const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });

	return (
		<div className="min-h-screen bg-white">

			{/* Hero Section - Netflix style with text overlay on image */}
			<section className="relative w-full h-[90vh] overflow-hidden">
				{/* Background Image */}
				<div className="absolute inset-0">
					<img
						src={mainImg}
						alt="Volunteers united"
						className="w-full h-full object-cover"
					/>
					{/* Dark overlay for better text readability */}
					<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
				</div>

				{/* Hero Text Content - Overlaid on image */}
				<div
					ref={hero.ref}
					className={`relative z-10 h-full flex flex-col items-center justify-center px-4 text-center transition-all duration-1000 ${
						hero.isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-10"
					}`}
				>
					<h1 className="font-(family-name:--font-crimson) font-medium text-6xl md:text-7xl lg:text-8xl mb-6 text-white drop-shadow-2xl">
						Make a difference,
						<br />
						<span className="text-[#a8c97f]">together.</span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto drop-shadow-lg">
						Join our community of passionate volunteers and help create
						lasting change in your neighborhood.
					</p>
					<Link
						to="/events"
						className="inline-flex items-center gap-2 bg-[#556b2f] text-white text-lg px-8 py-4 rounded-full hover:bg-[#8e9c78] transition-colors group shadow-xl"
					>
						Explore Events
						<IconArrowUpRight
							className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
							size={20}
						/>
					</Link>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-20 bg-gray-50">
				<div
					ref={stats.ref}
					className={`max-w-7xl mx-auto px-4 transition-all duration-1000 ${
						stats.isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-10"
					}`}
				>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-lime-100 rounded-full mb-4">
								<IconUsers size={32} className="text-[#556b2f]" />
							</div>
							<h3 className="font-(family-name:--font-crimson) text-4xl font-bold text-gray-900 mb-2">
								5,000+
							</h3>
							<p className="text-gray-600">Active Volunteers</p>
						</div>

						<div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-lime-100 rounded-full mb-4">
								<IconCalendar size={32} className="text-[#556b2f]" />
							</div>
							<h3 className="font-(family-name:--font-crimson) text-4xl font-bold text-gray-900 mb-2">
								250+
							</h3>
							<p className="text-gray-600">Events This Year</p>
						</div>

						<div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-lime-100 rounded-full mb-4">
								<IconHeart size={32} className="text-[#556b2f]" />
							</div>
							<h3 className="font-(family-name:--font-crimson) text-4xl font-bold text-gray-900 mb-2">
								50,000+
							</h3>
							<p className="text-gray-600">Lives Impacted</p>
						</div>
					</div>
				</div>
			</section>

			{/* Mission Section */}
			<section className="py-20 px-4">
				<div
					ref={mission.ref}
					className={`max-w-6xl mx-auto transition-all duration-1000 ${
						mission.isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-10"
					}`}
				>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="font-(family-name:--font-crimson) text-5xl font-semibold mb-6 text-gray-900">
								Our Mission
							</h2>
							<p className="text-xl text-gray-700 leading-relaxed mb-6">
								VolunteerHub connects passionate individuals with
								meaningful opportunities to serve their communities.
								Whether it's environmental conservation, helping the
								elderly, or organizing charitable events, we make it easy
								to find and participate in causes you care about.
							</p>
							<p className="text-xl text-gray-700 leading-relaxed">
								Together, we're building a culture of service, one
								volunteer at a time.
							</p>
						</div>
						<div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
							<img
								src={mainImg}
								alt="Volunteers helping"
								className="w-full h-full object-cover"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Events Carousel */}
			<section className="py-20 bg-gray-50">
				<div
					ref={events.ref}
					className={`max-w-7xl mx-auto px-4 transition-all duration-1000 ${
						events.isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-10"
					}`}
				>
					<div className="flex justify-between items-center mb-12">
						<h2 className="font-(family-name:--font-crimson) text-5xl font-semibold text-gray-900">
							Upcoming Events
						</h2>
						<Link
							to="/events"
							className="text-[#556b2f] hover:text-[#8e9c78] font-semibold flex items-center gap-2 group"
						>
							View all events
							<IconArrowUpRight
								className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
								size={20}
							/>
						</Link>
					</div>

					{/* Carousel */}
					<div className="overflow-hidden" ref={emblaRef}>
						<div className="flex gap-6">
							{exampleEventsList.map((event, index) => (
								<div
									key={index}
									className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
								>
									<Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
										<div className="aspect-video w-full overflow-hidden">
											<img
												src={event.imageUrl}
												alt={event.eventName}
												className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
											/>
										</div>

										<CardHeader>
											<CardTitle className="font-(family-name:--font-crimson) text-2xl">
												{event.eventName}
											</CardTitle>
											<CardDescription className="text-base">
												{event.date} at {event.time}
											</CardDescription>
										</CardHeader>

										<CardContent>
											<Link
												to="/events"
												className="inline-flex items-center gap-2 text-[#556b2f] hover:text-[#8e9c78] font-semibold group"
											>
												Learn more
												<IconArrowUpRight
													className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
													size={16}
												/>
											</Link>
										</CardContent>
									</Card>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4">
				<div
					ref={cta.ref}
					className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
						cta.isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-10"
					}`}
				>
					<h2 className="font-(family-name:--font-crimson) text-5xl font-semibold mb-6 text-gray-900">
						Ready to make an impact?
					</h2>
					<p className="text-xl text-gray-700 mb-8">
						Join thousands of volunteers who are changing lives every day.
					</p>
					<Link
						to="/events"
						className="inline-flex items-center gap-2 bg-[#556b2f] text-white text-lg px-8 py-4 rounded-full hover:bg-[#8e9c78] transition-colors group"
					>
						Get Started
						<IconArrowUpRight
							className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
							size={20}
						/>
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-gray-300 py-12 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
						<div>
							<h3 className="font-(family-name:--font-crimson) text-2xl font-bold text-white mb-4">
								VolunteerHub
							</h3>
							<p className="text-gray-400">
								Making a difference, together.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-white mb-4">Quick Links</h4>
							<ul className="space-y-2">
								<li>
									<Link to="/" className="hover:text-[#8e9c78] transition-colors">
										Home
									</Link>
								</li>
								<li>
									<Link to="/events" className="hover:text-[#8e9c78] transition-colors">
										Events
									</Link>
								</li>
								<li>
									<Link to="/newsfeed" className="hover:text-[#8e9c78] transition-colors">
										News Feed
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-white mb-4">Get Involved</h4>
							<ul className="space-y-2">
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Become a Volunteer
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Host an Event
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Partner with Us
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-white mb-4">Connect</h4>
							<ul className="space-y-2">
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Facebook
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Twitter
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-[#8e9c78] transition-colors">
										Instagram
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="border-t border-gray-800 pt-8 text-center text-gray-400">
						<p>&copy; 2025 VolunteerHub. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
