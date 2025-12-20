import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
	IconHeart,
	IconHeartFilled,
	IconMessageCircle,
	IconSend,
	IconUser,
	IconPhoto,
	IconX,
	IconChevronDown,
	IconChevronUp,
	IconTrash,
	IconCalendarEvent,
} from "@tabler/icons-react";

import {
	Card,
	CardContent,
	CardHeader,
} from "@/components/ui/card";

import { RestClient } from "@/api/RestClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./ui/Toast";

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface User {
	id: number;
	username: string;
	fullName?: string;
}

interface Event {
	id: number;
	title: string;
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
	event?: Event | null;
}

export default function NewsFeed() {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [newPostContent, setNewPostContent] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
	const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
	const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
	const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
	const [replyingTo, setReplyingTo] = useState<{ postId: number; commentId?: number; rootCommentId?: number } | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
	const [commentReplies, setCommentReplies] = useState<Record<number, Comment[]>>({});
	
	const { showToast } = useToast();
	const { user, isAuthenticated } = useAuth();

	const getSupabaseImageUrl = (imageUrl: string): string => {
		if (!imageUrl) return "";
		if (imageUrl.startsWith("http")) return imageUrl;
		const { data } = supabase.storage.from("volunteer").getPublicUrl(imageUrl);
		return data?.publicUrl || "";
	};

	const fetchPosts = useCallback(async () => {
		try {
			setLoading(true);
			console.log("Fetching news feed for user:", user?.id);
			const result = await RestClient.getNewsFeedPosts(user?.id);
			console.log("News feed API response:", result);
			if (result.data) {
				console.log("Posts received:", result.data.length, result.data);
				setPosts(result.data);
				// Check which posts the user has liked
				if (user?.id) {
					const likedSet = new Set<number>();
					for (const post of result.data) {
						try {
							const likeResult = await RestClient.checkLikePost(user.id, post.id);
							if (likeResult.data === true) {
								likedSet.add(post.id);
							}
						} catch {
							// Ignore individual like check errors
						}
					}
					setLikedPosts(likedSet);
				}
			} else {
				console.log("No data in response or data is null");
			}
		} catch (error) {
			console.error("Failed to fetch news feed:", error);
			showToast("Failed to load news feed", "error");
		} finally {
			setLoading(false);
		}
	}, [user?.id]);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

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

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const clearImage = () => {
		setImageFile(null);
		setImagePreview("");
	};

	const uploadImage = async (): Promise<string | null> => {
		if (!imageFile) return null;

		try {
			const fileExt = imageFile.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `posts/${fileName}`;

			const { error } = await supabase.storage
				.from("volunteer")
				.upload(filePath, imageFile, {
					cacheControl: '3600',
					upsert: false
				});

			if (error) {
				console.error("Supabase upload error:", error);
				showToast(`Upload failed: ${error.message}`, "error");
				return null;
			}

			const { data: urlData } = supabase.storage.from("volunteer").getPublicUrl(filePath);
			return urlData?.publicUrl || filePath;
		} catch (err) {
			console.error("Image upload exception:", err);
			showToast("Failed to upload image", "error");
			return null;
		}
	};

	const handleSubmitPost = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		
		if (!newPostContent.trim()) {
			showToast("Post content cannot be empty!", "warning");
			return;
		}

		if (!user?.id) {
			showToast("You must be logged in to post!", "error");
			return;
		}

		setIsSubmitting(true);

		try {
			let imageUrl: string | undefined;
			if (imageFile) {
				const uploadedUrl = await uploadImage();
				if (uploadedUrl) {
					imageUrl = uploadedUrl;
				}
			}

			const result = await RestClient.createNewsFeedPost(
				user.id,
				newPostContent,
				imageUrl
			);
			
			if (result.data) {
				setPosts([result.data, ...posts]);
				setNewPostContent("");
				clearImage();
				showToast("Post created successfully!", "success");
			}
		} catch (error) {
			console.error("Failed to create post:", error);
			showToast("Failed to create post", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLikePost = async (postId: number) => {
		if (!user?.id) {
			showToast("You must be logged in to like!", "error");
			return;
		}

		try {
			await RestClient.toggleLikePost(user.id, postId);
			const isLiked = likedPosts.has(postId);
			
			const newLikedPosts = new Set(likedPosts);
			if (isLiked) {
				newLikedPosts.delete(postId);
			} else {
				newLikedPosts.add(postId);
			}
			setLikedPosts(newLikedPosts);

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

	const handleDeletePost = async (postId: number) => {
		if (!user?.id) {
			showToast("You must be logged in!", "error");
			return;
		}

		if (!confirm("Are you sure you want to delete this post?")) {
			return;
		}

		try {
			const result = await RestClient.deletePost(postId);
			if (result.message) {
				setPosts(posts.filter(post => post.id !== postId));
				showToast("Post deleted successfully!", "success");
			}
		} catch (error) {
			console.error("Failed to delete post:", error);
			showToast("Failed to delete post", "error");
		}
	};

	const toggleComments = async (postId: number) => {
		const newExpanded = new Set(expandedComments);
		if (newExpanded.has(postId)) {
			newExpanded.delete(postId);
		} else {
			newExpanded.add(postId);
			if (!postComments[postId]) {
				try {
					const result = await RestClient.getCommentsByPostId(postId);
					if (result.data) {
						setPostComments(prev => ({ ...prev, [postId]: result.data }));
						if (user?.id) {
							const likedSet = new Set(likedComments);
							for (const comment of result.data) {
								try {
									const likeResult = await RestClient.checkLikeComment(user.id, comment.id);
									if (likeResult.data === true) {
										likedSet.add(comment.id);
									}
								} catch {
									// Ignore
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

	const handleLikeComment = async (commentId: number, postId: number) => {
		if (!user?.id) {
			showToast("You must be logged in to like!", "error");
			return;
		}

		try {
			await RestClient.toggleLikeComment(user.id, commentId);
			const isLiked = likedComments.has(commentId);
			
			const newLikedComments = new Set(likedComments);
			if (isLiked) {
				newLikedComments.delete(commentId);
			} else {
				newLikedComments.add(commentId);
			}
			setLikedComments(newLikedComments);

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

	const handleDeleteComment = async (commentId: number, postId: number, isReply: boolean = false, parentCommentId?: number) => {
		if (!user?.id) {
			showToast("You must be logged in!", "error");
			return;
		}

		if (!confirm("Are you sure you want to delete this comment?")) {
			return;
		}

		try {
			const result = await RestClient.deleteComment(commentId);
			if (result.message) {
				if (isReply && parentCommentId) {
					setCommentReplies(prev => ({
						...prev,
						[parentCommentId]: prev[parentCommentId]?.filter(reply => reply.id !== commentId) || []
					}));
				} else {
					setPostComments(prev => ({
						...prev,
						[postId]: prev[postId]?.filter(comment => comment.id !== commentId) || []
					}));
				}
				setPosts(posts.map(post => {
					if (post.id === postId) {
						return { ...post, commentsCount: Math.max(0, post.commentsCount - 1) };
					}
					return post;
				}));
				showToast("Comment deleted!", "success");
			}
		} catch (error) {
			console.error("Failed to delete comment:", error);
			showToast("Failed to delete comment", "error");
		}
	};

	const handleSubmitComment = async (postId: number, parentCommentId?: number) => {
		if (!replyContent.trim()) {
			showToast("Comment cannot be empty!", "warning");
			return;
		}

		if (!user?.id) {
			showToast("You must be logged in to comment!", "error");
			return;
		}

		const actualParentId = replyingTo?.rootCommentId || parentCommentId;

		try {
			const result = await RestClient.createComment(
				postId,
				user.id,
				replyContent,
				actualParentId
			);
			
			if (result.data) {
				if (actualParentId) {
					setCommentReplies(prev => ({
						...prev,
						[actualParentId]: [result.data, ...(prev[actualParentId] || [])]
					}));
					setExpandedReplies(prev => {
						const newSet = new Set(prev);
						newSet.add(actualParentId);
						return newSet;
					});
				} else {
					setPostComments(prev => ({
						...prev,
						[postId]: [result.data, ...(prev[postId] || [])]
					}));
				}
				
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

	const CommentItem = ({ comment, postId, isReply = false, rootCommentId }: { comment: Comment; postId: number; isReply?: boolean; rootCommentId?: number }) => (
		<div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'py-3'}`}>
			<div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} bg-lime-700 rounded-full flex items-center justify-center flex-shrink-0`}>
				<IconUser size={isReply ? 14 : 16} className="text-white" />
			</div>
			<div className="flex-1">
				<div className="bg-gray-100 rounded-2xl px-4 py-2">
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
				<div className="flex items-center gap-4 mt-1 ml-2">
					<button
						onClick={() => handleLikeComment(comment.id, postId)}
						className={`flex items-center gap-1 text-xs font-medium ${
							likedComments.has(comment.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
						} transition-colors`}
					>
						{likedComments.has(comment.id) ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
						{comment.likesCount > 0 && comment.likesCount}
					</button>
					{isAuthenticated && (
						<button
							onClick={() => {
								setReplyingTo({ 
									postId, 
									commentId: comment.id,
									rootCommentId: isReply ? rootCommentId : comment.id
								});
							}}
							className="text-xs font-medium text-gray-500 hover:text-lime-700 transition-colors"
						>
							Reply
						</button>
					)}
					{user?.id === comment.user?.id && (
						<button
							onClick={() => handleDeleteComment(comment.id, postId, isReply, rootCommentId)}
							className="text-xs text-gray-400 hover:text-red-500 transition-colors"
							title="Delete"
						>
							<IconTrash size={14} />
						</button>
					)}
				</div>
				
				{/* Replies */}
				{!isReply && comment.repliesCount > 0 && (
					<button
						onClick={() => toggleReplies(comment.id)}
						className="flex items-center gap-1 text-xs text-lime-700 hover:text-lime-800 mt-2 ml-2 font-medium"
					>
						{expandedReplies.has(comment.id) ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
						{comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
					</button>
				)}
				
				{expandedReplies.has(comment.id) && commentReplies[comment.id]?.map(reply => (
					<CommentItem 
						key={reply.id} 
						comment={reply} 
						postId={postId} 
						isReply={true}
						rootCommentId={comment.id}
					/>
				))}
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="relative font-(family-name:--font-crimson) font-medium top-10 mb-16 text-[4rem] sm:text-[5rem] text-center text-gray-900">
					News Feed.
				</h1>

				{/* Create Post Card (only for logged-in users) */}
				{isAuthenticated && (
					<Card className="mb-6 shadow-sm border-0 bg-white">
						<CardContent className="pt-6">
							<div className="flex gap-4">
								<div className="w-12 h-12 bg-lime-700 rounded-full flex items-center justify-center flex-shrink-0">
									<IconUser size={24} className="text-white" />
								</div>
								<div className="flex-1">
									<textarea
										value={newPostContent}
										onChange={(e) => setNewPostContent(e.target.value)}
										placeholder="What's on your mind?"
										className="w-full p-3 border-0 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-lime-600 text-gray-800 placeholder-gray-500"
										rows={3}
									/>
									
									{imagePreview && (
										<div className="relative mt-3 inline-block">
											<img
												src={imagePreview}
												alt="Preview"
												className="max-h-48 rounded-xl object-cover"
											/>
											<button
												onClick={clearImage}
												className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
											>
												<IconX size={16} />
											</button>
										</div>
									)}
									
									<div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
										<label className="flex items-center gap-2 text-gray-600 hover:text-lime-700 cursor-pointer transition-colors">
											<IconPhoto size={22} />
											<span className="text-sm font-medium">Photo</span>
											<input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												className="hidden"
											/>
										</label>
										
										<button
											onClick={handleSubmitPost}
											disabled={isSubmitting || !newPostContent.trim()}
											className="flex items-center gap-2 bg-lime-700 text-white px-5 py-2 rounded-full hover:bg-lime-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
										>
											<IconSend size={18} />
											{isSubmitting ? "Posting..." : "Post"}
										</button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Loading State */}
				{loading && (
					<div className="flex justify-center py-12">
						<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lime-700"></div>
					</div>
				)}

				{/* Posts Feed */}
				{!loading && (
					<div className="flex flex-col gap-4">
						{posts.map((post) => (
							<Card key={post.id} className="overflow-hidden shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 bg-lime-700 rounded-full flex items-center justify-center">
												<IconUser size={24} className="text-white" />
											</div>
											<div>
												<p className="font-semibold text-base text-gray-900">
													{post.user?.fullName || post.user?.username || "Unknown"}
												</p>
												<div className="flex items-center gap-2 text-sm text-gray-500">
													<span>{formatTimeAgo(post.createdAt)}</span>
													{post.event && (
														<>
															<span>•</span>
															<Link 
																to={`/events/${post.event.id}`}
																className="flex items-center gap-1 text-lime-700 hover:text-lime-800 hover:underline"
															>
																<IconCalendarEvent size={14} />
																{post.event.title}
															</Link>
														</>
													)}
												</div>
											</div>
										</div>
										{user?.id === post.user?.id && (
											<button
												onClick={() => handleDeletePost(post.id)}
												className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
												title="Delete post"
											>
												<IconTrash size={18} />
											</button>
										)}
									</div>
								</CardHeader>

								<CardContent className="pt-0">
									{/* Post Content */}
									<p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
										{post.content}
									</p>

									{/* Post Image */}
									{post.imageUrl && (
										<div className="w-full overflow-hidden rounded-xl mb-4">
											<img
												src={getSupabaseImageUrl(post.imageUrl)}
												alt="Post"
												className="w-full max-h-[500px] object-cover"
											/>
										</div>
									)}

									{/* Stats */}
									<div className="flex items-center gap-4 text-sm text-gray-500 pb-3 border-b border-gray-100">
										{post.likesCount > 0 && (
											<span className="flex items-center gap-1">
												<IconHeartFilled size={16} className="text-red-500" />
												{post.likesCount}
											</span>
										)}
										{post.commentsCount > 0 && (
											<span>{post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}</span>
										)}
									</div>

									{/* Action Buttons */}
									<div className="flex items-center gap-2 pt-2">
										<button
											onClick={() => handleLikePost(post.id)}
											className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
												likedPosts.has(post.id)
													? "text-red-500 bg-red-50 hover:bg-red-100"
													: "text-gray-600 hover:bg-gray-100"
											}`}
										>
											{likedPosts.has(post.id) ? (
												<IconHeartFilled size={20} />
											) : (
												<IconHeart size={20} />
											)}
											<span>Like</span>
										</button>

										<button
											onClick={() => toggleComments(post.id)}
											className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
										>
											<IconMessageCircle size={20} />
											<span>Comment</span>
										</button>
									</div>

									{/* Comments Section */}
									{expandedComments.has(post.id) && (
										<div className="mt-4 pt-4 border-t border-gray-100">
											{/* Comment Input */}
											{isAuthenticated && (
												<div className="flex gap-3 mb-4">
													<div className="w-9 h-9 bg-lime-700 rounded-full flex items-center justify-center flex-shrink-0">
														<IconUser size={18} className="text-white" />
													</div>
													<div className="flex-1 flex gap-2">
														<input
															type="text"
															value={replyingTo?.postId === post.id && !replyingTo?.commentId ? replyContent : (replyingTo?.postId === post.id ? replyContent : "")}
															onChange={(e) => {
																if (!replyingTo || replyingTo.postId !== post.id) {
																	setReplyingTo({ postId: post.id });
																}
																setReplyContent(e.target.value);
															}}
															onFocus={() => {
																if (!replyingTo || replyingTo.postId !== post.id) {
																	setReplyingTo({ postId: post.id });
																}
															}}
															placeholder="Write a comment..."
															className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-lime-600"
														/>
														<button
															onClick={() => handleSubmitComment(post.id)}
															disabled={!replyContent.trim()}
															className="p-2 bg-lime-700 text-white rounded-full hover:bg-lime-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<IconSend size={18} />
														</button>
													</div>
												</div>
											)}

											{/* Reply indicator */}
											{replyingTo?.postId === post.id && replyingTo?.commentId && (
												<div className="flex items-center gap-2 mb-3 ml-12 text-sm text-lime-700">
													<span>Replying to a comment</span>
													<button
														onClick={() => {
															setReplyingTo({ postId: post.id });
															setReplyContent("");
														}}
														className="text-gray-500 hover:text-gray-700"
													>
														<IconX size={14} />
													</button>
												</div>
											)}

											{/* Comments List */}
											<div className="divide-y divide-gray-50">
												{postComments[post.id]?.map(comment => (
													<CommentItem 
														key={comment.id} 
														comment={comment} 
														postId={post.id}
													/>
												))}
												
												{(!postComments[post.id] || postComments[post.id].length === 0) && (
													<p className="text-center text-gray-500 py-4 text-sm">
														No comments yet. Be the first to comment!
													</p>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						))}

						{posts.length === 0 && !loading && (
							<div className="text-center py-16">
								<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<IconMessageCircle size={40} className="text-gray-400" />
								</div>
								<h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
								<p className="text-gray-500">
									{isAuthenticated 
										? "Be the first to share something with the community!"
										: "Sign in to see posts from events you've joined and share your own stories!"}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
