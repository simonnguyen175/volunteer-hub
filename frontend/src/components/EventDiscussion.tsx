import { useState, useEffect, useCallback } from "react";
import { IconSend, IconUser, IconPhoto, IconHeart, IconHeartFilled, IconMessage, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useToast } from "./ui/Toast";
import { RestClient } from "@/api/RestClient";
import { useAuth } from "@/contexts/AuthContext";

interface User {
	id: number;
	username: string;
	fullName?: string;
}

interface Comment {
	id: number;
	content: string;
	likesCount: number;
	repliesCount: number;
	createdAt: string;
	user: User;
	parentComment?: Comment;
}

interface Post {
	id: number;
	content: string;
	imageUrl?: string;
	likesCount: number;
	commentsCount: number;
	createdAt: string;
	user: User;
}

interface EventDiscussionProps {
	eventId: string;
}

export default function EventDiscussion({ eventId }: EventDiscussionProps) {
	const [posts, setPosts] = useState<Post[]>([]);
	const [newPostContent, setNewPostContent] = useState("");
	const [newPostImage, setNewPostImage] = useState("");
	const [loading, setLoading] = useState(true);
	const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
	const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
	const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
	const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
	const [replyingTo, setReplyingTo] = useState<{ postId: number; commentId?: number; rootCommentId?: number } | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
	const [commentReplies, setCommentReplies] = useState<Record<number, Comment[]>>({});
	const { showToast } = useToast();
	const auth = useAuth();

	const fetchPosts = useCallback(async () => {
		try {
			setLoading(true);
			const result = await RestClient.getPostsByEventId(parseInt(eventId));
			if (result.data) {
				setPosts(result.data);
				// Check which posts the user has liked
				if (auth.user?.id) {
					const likedSet = new Set<number>();
					for (const post of result.data) {
						const likeResult = await RestClient.checkLikePost(auth.user.id, post.id);
						if (likeResult.data === true) {
							likedSet.add(post.id);
						}
					}
					setLikedPosts(likedSet);
				}
			}
		} catch (error) {
			console.error("Failed to fetch posts:", error);
		} finally {
			setLoading(false);
		}
	}, [eventId, auth.user?.id]);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	const handleSubmitPost = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!newPostContent.trim()) {
			showToast("Post content cannot be empty!", "warning");
			return;
		}

		if (!auth.user?.id) {
			showToast("You must be logged in to post!", "error");
			return;
		}

		try {
			const result = await RestClient.createPost(
				parseInt(eventId),
				auth.user.id,
				newPostContent,
				newPostImage || undefined
			);
			
			if (result.data) {
				setPosts([result.data, ...posts]);
				setNewPostContent("");
				setNewPostImage("");
				showToast("Post created successfully!", "success");
			}
		} catch (error) {
			console.error("Failed to create post:", error);
			showToast("Failed to create post", "error");
		}
	};

	const handleLikePost = async (postId: number) => {
		if (!auth.user?.id) {
			showToast("You must be logged in to like!", "error");
			return;
		}

		try {
			await RestClient.toggleLikePost(auth.user.id, postId);
			const isLiked = likedPosts.has(postId);
			
			// Update local state
			const newLikedPosts = new Set(likedPosts);
			if (isLiked) {
				newLikedPosts.delete(postId);
			} else {
				newLikedPosts.add(postId);
			}
			setLikedPosts(newLikedPosts);

			// Update post likes count
			setPosts(posts.map(post => {
				if (post.id === postId) {
					return {
						...post,
						likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1
					};
				}
				return post;
			}));
		} catch (error) {
			console.error("Failed to like post:", error);
		}
	};

	const handleLikeComment = async (commentId: number, postId: number) => {
		if (!auth.user?.id) {
			showToast("You must be logged in to like!", "error");
			return;
		}

		try {
			await RestClient.toggleLikeComment(auth.user.id, commentId);
			const isLiked = likedComments.has(commentId);
			
			const newLikedComments = new Set(likedComments);
			if (isLiked) {
				newLikedComments.delete(commentId);
			} else {
				newLikedComments.add(commentId);
			}
			setLikedComments(newLikedComments);

			// Update comment likes count
			setPostComments(prev => ({
				...prev,
				[postId]: prev[postId]?.map(comment => {
					if (comment.id === commentId) {
						return {
							...comment,
							likesCount: isLiked ? comment.likesCount - 1 : comment.likesCount + 1
						};
					}
					return comment;
				}) || []
			}));
		} catch (error) {
			console.error("Failed to like comment:", error);
		}
	};

	const toggleComments = async (postId: number) => {
		const newExpanded = new Set(expandedComments);
		if (newExpanded.has(postId)) {
			newExpanded.delete(postId);
		} else {
			newExpanded.add(postId);
			// Fetch comments if not already loaded
			if (!postComments[postId]) {
				try {
					const result = await RestClient.getCommentsByPostId(postId);
					if (result.data) {
						setPostComments(prev => ({ ...prev, [postId]: result.data }));
						// Check which comments the user has liked
						if (auth.user?.id) {
							const likedSet = new Set(likedComments);
							for (const comment of result.data) {
								const likeResult = await RestClient.checkLikeComment(auth.user.id, comment.id);
								if (likeResult.data === true) {
									likedSet.add(comment.id);
								}
							}
							setLikedComments(likedSet);
						}
					}
				} catch (error) {
					console.error("Failed to fetch comments:", error);
				}
			}
		}
		setExpandedComments(newExpanded);
	};

	const toggleReplies = async (commentId: number) => {
		const newExpanded = new Set(expandedReplies);
		if (newExpanded.has(commentId)) {
			newExpanded.delete(commentId);
		} else {
			newExpanded.add(commentId);
			// Fetch replies if not already loaded
			if (!commentReplies[commentId]) {
				try {
					const result = await RestClient.getRepliesByCommentId(commentId);
					if (result.data) {
						setCommentReplies(prev => ({ ...prev, [commentId]: result.data }));
					}
				} catch (error) {
					console.error("Failed to fetch replies:", error);
				}
			}
		}
		setExpandedReplies(newExpanded);
	};

	const handleSubmitComment = async (postId: number, parentCommentId?: number) => {
		if (!replyContent.trim()) {
			showToast("Comment cannot be empty!", "warning");
			return;
		}

		if (!auth.user?.id) {
			showToast("You must be logged in to comment!", "error");
			return;
		}

		// Use rootCommentId if available (for replies to replies), otherwise use parentCommentId
		const actualParentId = replyingTo?.rootCommentId || parentCommentId;

		try {
			const result = await RestClient.createComment(
				postId,
				auth.user.id,
				replyContent,
				actualParentId
			);
			
			if (result.data) {
				if (actualParentId) {
					// Add to replies of the root comment
					setCommentReplies(prev => ({
						...prev,
						[actualParentId]: [...(prev[actualParentId] || []), result.data]
					}));
				} else {
					// Add to comments
					setPostComments(prev => ({
						...prev,
						[postId]: [...(prev[postId] || []), result.data]
					}));
				}
				
				// Update post comments count
				setPosts(posts.map(post => {
					if (post.id === postId) {
						return { ...post, commentsCount: post.commentsCount + 1 };
					}
					return post;
				}));

				setReplyContent("");
				setReplyingTo(null);
				showToast("Comment posted!", "success");
			}
		} catch (error) {
			console.error("Failed to create comment:", error);
			showToast("Failed to post comment", "error");
		}
	};

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		return date.toLocaleDateString();
	};

	const CommentItem = ({ comment, postId, isReply = false, rootCommentId }: { comment: Comment; postId: number; isReply?: boolean; rootCommentId?: number }) => (
		<div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'py-3'}`}>
			<div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} bg-[#747e59] rounded-full flex items-center justify-center flex-shrink-0`}>
				<IconUser size={isReply ? 14 : 16} className="text-white" />
			</div>
			<div className="flex-1">
				<div className="bg-gray-50 rounded-lg px-3 py-2">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-sm text-gray-900">
							{comment.user?.fullName || comment.user?.username || "Unknown"}
						</span>
						{comment.createdAt && (
							<>
								<span className="text-xs text-gray-400">•</span>
								<span className="text-xs text-gray-500">
									{formatTimeAgo(comment.createdAt)}
								</span>
							</>
						)}
					</div>
					<p className="text-sm text-gray-700 mt-1">{comment.content}</p>
				</div>
				<div className="flex items-center gap-4 mt-1 ml-1">
					<button
						onClick={() => handleLikeComment(comment.id, postId)}
						className={`flex items-center gap-1 text-xs ${
							likedComments.has(comment.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
						} transition-colors`}
					>
						{likedComments.has(comment.id) ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
						{comment.likesCount > 0 && comment.likesCount}
					</button>
					<button
						onClick={() => {
							if (!auth.user?.id) {
								showToast("You must be logged in to comment!", "error");
								return;
							}
							setReplyingTo({ 
								postId, 
								commentId: comment.id,
								// If this is a reply, use the rootCommentId; otherwise this comment becomes the root
								rootCommentId: isReply ? rootCommentId : comment.id
							});
						}}
						className="text-xs text-gray-500 hover:text-[#556b2f] transition-colors"
					>
						Reply
					</button>
					{!isReply && comment.repliesCount > 0 && (
						<button
							onClick={() => toggleReplies(comment.id)}
							className="flex items-center gap-1 text-xs text-[#556b2f] hover:text-[#6d8c3a] transition-colors"
						>
							{expandedReplies.has(comment.id) ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
							{comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
						</button>
					)}
				</div>
				
				{/* Reply input */}
				{replyingTo?.commentId === comment.id && (
					<div className="mt-2 flex gap-2">
						<input
							type="text"
							value={replyContent}
							onChange={(e) => setReplyContent(e.target.value)}
							placeholder="Write a reply..."
							className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
							autoFocus
						/>
						<button
							onClick={() => handleSubmitComment(postId, comment.id)}
							className="bg-[#556b2f] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#6d8c3a] transition-colors"
						>
							<IconSend size={16} />
						</button>
						<button
							onClick={() => { setReplyingTo(null); setReplyContent(""); }}
							className="text-gray-500 hover:text-gray-700 text-sm"
						>
							Cancel
						</button>
					</div>
				)}

				{/* Replies - only show for top-level comments */}
				{!isReply && expandedReplies.has(comment.id) && commentReplies[comment.id]?.map(reply => (
					<CommentItem key={reply.id} comment={reply} postId={postId} isReply rootCommentId={comment.id} />
				))}
			</div>
		</div>
	);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#556b2f]"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Create New Post Form */}
			{auth.isAuthenticated && (
				<div className="bg-white border border-gray-200 rounded-xl p-6">
					<h3 className="font-semibold text-lg mb-4 text-gray-900 font-(family-name:--font-crimson)">
						Start a Discussion
					</h3>
					<form onSubmit={handleSubmitPost} className="space-y-4">
						<div>
							<textarea
								value={newPostContent}
								onChange={(e) => setNewPostContent(e.target.value)}
								placeholder="Share your thoughts, questions, or updates about this event..."
								className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent resize-none font-(family-name:--font-dmsans)"
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
								className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent font-(family-name:--font-dmsans)"
							/>
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								className="flex items-center gap-2 bg-[#556b2f] text-white px-6 py-2 rounded-lg hover:bg-[#6d8c3a] transition-colors font-semibold font-(family-name:--font-dmsans)"
							>
								<IconSend size={18} />
								Post
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Discussion Posts */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg text-gray-900 font-(family-name:--font-crimson)">
					Discussion ({posts.length})
				</h3>
				
				{posts.length === 0 ? (
					<div className="text-center py-12 text-gray-500 font-(family-name:--font-dmsans)">
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
											<span className="font-semibold text-gray-900 font-(family-name:--font-dmsans)">
												{post.user?.fullName || post.user?.username || "Unknown"}
											</span>
											<span className="text-sm text-gray-500">•</span>
											<span className="text-sm text-gray-500 font-(family-name:--font-dmsans)">
												{formatTimeAgo(post.createdAt)}
											</span>
										</div>
									</div>
								</div>

								{/* Post Content */}
								<div className="ml-13">
									<p className="text-gray-700 mb-3 whitespace-pre-wrap font-(family-name:--font-dmsans)">
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

									{/* Post Actions */}
									<div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
										<button
											onClick={() => handleLikePost(post.id)}
											className={`flex items-center gap-2 ${
												likedPosts.has(post.id) 
													? 'text-red-500' 
													: 'text-gray-500 hover:text-red-500'
											} transition-colors font-(family-name:--font-dmsans)`}
										>
											{likedPosts.has(post.id) ? (
												<IconHeartFilled size={20} />
											) : (
												<IconHeart size={20} />
											)}
											<span className="text-sm">{post.likesCount} Like{post.likesCount !== 1 && 's'}</span>
										</button>
										<button
											onClick={() => toggleComments(post.id)}
											className="flex items-center gap-2 text-gray-500 hover:text-[#556b2f] transition-colors font-(family-name:--font-dmsans)"
										>
											<IconMessage size={20} />
											<span className="text-sm">{post.commentsCount} Comment{post.commentsCount !== 1 && 's'}</span>
										</button>
									</div>

									{/* Comments Section */}
									{expandedComments.has(post.id) && (
										<div className="mt-4 pt-4 border-t border-gray-100">
											{/* Add Comment Input */}
											{auth.isAuthenticated && !replyingTo?.commentId && (
												<div className="flex gap-3 mb-4">
													<div className="w-8 h-8 bg-[#747e59] rounded-full flex items-center justify-center flex-shrink-0">
														<IconUser size={16} className="text-white" />
													</div>
													<div className="flex-1 flex gap-2">
														<input
															type="text"
															value={replyingTo?.postId === post.id && !replyingTo?.commentId ? replyContent : ""}
															onChange={(e) => {
																setReplyContent(e.target.value);
																if (!replyingTo || replyingTo.postId !== post.id) {
																	setReplyingTo({ postId: post.id });
																}
															}}
															placeholder="Write a comment..."
															className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] font-(family-name:--font-dmsans)"
														/>
														<button
															onClick={() => handleSubmitComment(post.id)}
															disabled={!replyContent.trim()}
															className="bg-[#556b2f] text-white px-4 py-2 rounded-full text-sm hover:bg-[#6d8c3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<IconSend size={16} />
														</button>
													</div>
												</div>
											)}

											{/* Comments List */}
											<div className="divide-y divide-gray-100">
												{postComments[post.id]?.length === 0 ? (
													<p className="text-sm text-gray-500 py-4 text-center font-(family-name:--font-dmsans)">
														No comments yet. Be the first to comment!
													</p>
												) : (
													postComments[post.id]?.map(comment => (
														<CommentItem key={comment.id} comment={comment} postId={post.id} />
													))
												)}
											</div>
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
