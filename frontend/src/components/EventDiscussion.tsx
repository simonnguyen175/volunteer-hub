import { useState } from "react";
import { IconSend, IconUser, IconPhoto } from "@tabler/icons-react";
import { useToast } from "./ui/Toast";

interface Post {
	id: string;
	author: string;
	timestamp: string;
	content: string;
	imageUrl?: string;
}

interface EventDiscussionProps {
	eventId: string;
}

// Mock initial posts for demonstration
const initialPosts: Post[] = [
	{
		id: "1",
		author: "Sarah Chen",
		timestamp: "2 hours ago",
		content: "Really excited for this event! Is there parking available nearby?",
	},
	{
		id: "2",
		author: "Michael Torres",
		timestamp: "5 hours ago",
		content: "First time volunteering here. Can't wait to make a difference with everyone!",
	},
	{
		id: "3",
		author: "Emily Rodriguez",
		timestamp: "1 day ago",
		content: "Thanks for organizing this! I'll be bringing my family. Should kids bring their own gloves or will those be provided?",
	},
];

export default function EventDiscussion({ eventId }: EventDiscussionProps) {
	const [posts, setPosts] = useState<Post[]>(initialPosts);
	const [newPostContent, setNewPostContent] = useState("");
	const [newPostImage, setNewPostImage] = useState("");
	const { showToast } = useToast();

	const handleSubmitPost = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!newPostContent.trim()) {
			showToast("Post content cannot be empty!", "warning");
			return;
		}

		const newPost: Post = {
			id: Date.now().toString(),
			author: "You",
			timestamp: "Just now",
			content: newPostContent,
			imageUrl: newPostImage || undefined,
		};

		setPosts([newPost, ...posts]);
		setNewPostContent("");
		setNewPostImage("");
	};

	return (
		<div className="space-y-6">
			{/* Create New Post Form */}
			<div className="bg-white border border-gray-200 rounded-xl p-6">
				<h3 className="font-semibold text-lg mb-4 text-gray-900">
					Start a Discussion
				</h3>
				<form onSubmit={handleSubmitPost} className="space-y-4">
					<div>
						<textarea
							value={newPostContent}
							onChange={(e) => setNewPostContent(e.target.value)}
							placeholder="Share your thoughts, questions, or updates about this event..."
							className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent resize-none"
							required
						/>
					</div>
					
					<div className="flex items-center gap-2">
						<IconPhoto size={20} className="text-gray-500" />
						<input
							type="url"
							value={newPostImage}
							onChange={(e) => setNewPostImage(e.target.value)}
							placeholder="Image URL (optional)"
							className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent"
						/>
					</div>

					<div className="flex justify-end">
						<button
							type="submit"
							className="flex items-center gap-2 bg-[#556b2f] text-white px-6 py-2 rounded-lg hover:bg-[#6d8c3a] transition-colors font-semibold"
						>
							<IconSend size={18} />
							Post
						</button>
					</div>
				</form>
			</div>

			{/* Discussion Posts */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg text-gray-900">
					Discussion ({posts.length})
				</h3>
				
				{posts.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						No posts yet. Be the first to start a discussion!
					</div>
				) : (
					<div className="space-y-4">
						{posts.map((post) => (
							<div
								key={post.id}
								className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
							>
								{/* Post Header */}
								<div className="flex items-start gap-3 mb-3">
									<div className="w-10 h-10 bg-[#556b2f] rounded-full flex items-center justify-center flex-shrink-0">
										<IconUser size={20} className="text-white" />
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="font-semibold text-gray-900">
												{post.author}
											</span>
											<span className="text-sm text-gray-500">
												•
											</span>
											<span className="text-sm text-gray-500">
												{post.timestamp}
											</span>
										</div>
									</div>
								</div>

								{/* Post Content */}
								<div className="ml-13">
									<p className="text-gray-700 mb-3 whitespace-pre-wrap">
										{post.content}
									</p>
									
									{/* Optional Image */}
									{post.imageUrl && (
										<div className="mt-3">
											<img
												src={post.imageUrl}
												alt="Post attachment"
												className="rounded-lg max-h-96 w-auto object-cover"
												onError={(e) => {
													e.currentTarget.style.display = 'none';
												}}
											/>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
