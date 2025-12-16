import { useState } from "react";
import Header from "./Header";
import {
	IconHeart,
	IconMessageCircle,
	IconShare,
	IconSearch,
} from "@tabler/icons-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const exampleNewsList = [
	{
		id: 1,
		authorName: "Sarah Johnson",
		authorAvatar: "https://i.pravatar.cc/150?img=1",
		timestamp: "2 hours ago",
		title: "Amazing Beach Cleanup Drive Success!",
		content:
			"We had an incredible turnout at yesterday's beach cleanup event! Over 150 volunteers joined us to clean up our beautiful coastline. Together, we collected 300kg of trash and recycling. Thank you to everyone who participated! 🌊",
		imageUrl:
			"https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=900&auto=format&fit=crop&q=60",
		likes: 124,
		comments: 18,
	},
	{
		id: 2,
		authorName: "Michael Chen",
		authorAvatar: "https://i.pravatar.cc/150?img=12",
		timestamp: "5 hours ago",
		title: "Food Distribution Reaches 500 Families",
		content:
			"Our community food distribution program continues to make a difference. This month, we successfully delivered essential food supplies to over 500 families in need. Special thanks to all our volunteers and donors!",
		imageUrl:
			"https://images.unsplash.com/photo-1593113598332-cd288d649433?w=900&auto=format&fit=crop&q=60",
		likes: 89,
		comments: 12,
	},
	{
		id: 3,
		authorName: "Emma Williams",
		authorAvatar: "https://i.pravatar.cc/150?img=5",
		timestamp: "1 day ago",
		title: "Tree Planting Initiative Surpasses Goal",
		content:
			"We're thrilled to announce that our tree planting initiative has planted over 1,000 trees this year! 🌳 This milestone was achieved thanks to our dedicated volunteers. Together, we're creating a greener future for our community.",
		imageUrl:
			"https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&auto=format&fit=crop&q=60",
		likes: 203,
		comments: 34,
	},
	{
		id: 4,
		authorName: "David Martinez",
		authorAvatar: "https://i.pravatar.cc/150?img=8",
		timestamp: "2 days ago",
		title: "Elderly Home Visit Brings Joy",
		content:
			"Our volunteers spent a wonderful afternoon at the local elderly care home. We organized games, shared stories, and brought smiles to everyone's faces. The residents were so grateful for the company and connection.",
		imageUrl:
			"https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=900&auto=format&fit=crop&q=60",
		likes: 156,
		comments: 21,
	},
	{
		id: 5,
		authorName: "Lisa Anderson",
		authorAvatar: "https://i.pravatar.cc/150?img=9",
		timestamp: "3 days ago",
		title: "Blood Donation Camp Saves Lives",
		content:
			"Thank you to all 87 donors who participated in our blood donation camp! Your generosity will help save countless lives. Remember, one donation can save up to three lives. 🩸❤️",
		imageUrl:
			"https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=900&auto=format&fit=crop&q=60",
		likes: 178,
		comments: 15,
	},
	{
		id: 6,
		authorName: "James Thompson",
		authorAvatar: "https://i.pravatar.cc/150?img=15",
		timestamp: "4 days ago",
		title: "Charity Marathon Raises $50,000",
		content:
			"What an incredible day! Our charity marathon was a huge success with over 500 runners participating. Together, we raised $50,000 for local children's education programs. Every step made a difference! 🏃‍♂️",
		imageUrl:
			"https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=900&auto=format&fit=crop&q=60",
		likes: 267,
		comments: 42,
	},
];

export default function NewsFeed() {
	const [searchQuery, setSearchQuery] = useState("");
	const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

	const filteredNews = exampleNewsList.filter(
		(news) =>
			news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			news.content.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const toggleLike = (postId: number) => {
		setLikedPosts((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(postId)) {
				newSet.delete(postId);
			} else {
				newSet.add(postId);
			}
			return newSet;
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="relative font-(family-name:--font-crimson) font-medium top-10 mb-10 text-[5rem] text-center m-4">
					News Feed.
				</h1>

				{/* Search Bar */}
				<div className="relative max-w-xl mx-auto mb-8">
					<IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Search news..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-700"
					/>
				</div>

				{/* News Feed */}
				<div className="flex flex-col gap-6">
					{filteredNews.map((news) => (
						<Card
							key={news.id}
							className="overflow-hidden hover:shadow-lg transition-shadow"
						>
							{/* Author Info */}
							<CardHeader className="pb-3">
								<div className="flex items-center gap-3">
									<img
										src={news.authorAvatar}
										alt={news.authorName}
										className="w-12 h-12 rounded-full object-cover"
									/>
									<div>
										<p className="font-semibold text-base">
											{news.authorName}
										</p>
										<p className="text-sm text-gray-500">
											{news.timestamp}
										</p>
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Title */}
								<CardTitle className="font-(family-name:--font-crimson) text-2xl">
									{news.title}
								</CardTitle>

								{/* Content */}
								<p className="text-gray-700 leading-relaxed">
									{news.content}
								</p>

								{/* Image */}
								{news.imageUrl && (
									<div className="w-full overflow-hidden rounded-lg">
										<img
											src={news.imageUrl}
											alt={news.title}
											className="w-full h-80 object-cover"
										/>
									</div>
								)}

								{/* Interaction Buttons */}
								<div className="flex items-center gap-6 pt-2 border-t border-gray-200 mt-4">
									<button
										onClick={() => toggleLike(news.id)}
										className={`flex items-center gap-2 transition-colors ${
											likedPosts.has(news.id)
												? "text-red-600"
												: "text-gray-600 hover:text-red-600"
										}`}
									>
										<IconHeart
											size={20}
											fill={
												likedPosts.has(news.id)
													? "currentColor"
													: "none"
											}
										/>
										<span className="text-sm font-medium">
											{news.likes +
												(likedPosts.has(news.id)
													? 1
													: 0)}
										</span>
									</button>

									<button className="flex items-center gap-2 text-gray-600 hover:text-lime-700 transition-colors">
										<IconMessageCircle size={20} />
										<span className="text-sm font-medium">
											{news.comments}
										</span>
									</button>

									<button className="flex items-center gap-2 text-gray-600 hover:text-lime-700 transition-colors">
										<IconShare size={20} />
										<span className="text-sm font-medium">
											Share
										</span>
									</button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{filteredNews.length === 0 && (
					<div className="text-center py-12 text-gray-500">
						No news found matching your search.
					</div>
				)}
			</div>
		</div>
	);
}
