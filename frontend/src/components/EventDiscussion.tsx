import { useState, useEffect, useCallback, useRef } from "react";
import { IconSend, IconPhoto, IconHeart, IconHeartFilled, IconMessage, IconChevronDown, IconChevronUp, IconTrash, IconX } from "@tabler/icons-react";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "./ui/Toast";
import { useConfirmDialog } from "./ui/ConfirmDialog";
import { RestClient } from "@/api/RestClient";
import { useAuth } from "@/contexts/AuthContext";

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const observer = useRef<IntersectionObserver | null>(null);

	const lastPostElementRef = useCallback((node: HTMLDivElement) => {
		if (loading) return;
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && hasMore) {
				setPage(prevPage => prevPage + 1);
			}
		});
		if (node) observer.current.observe(node);
	}, [loading, hasMore]);

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
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();
	const auth = useAuth();

	const fetchPosts = useCallback(async (pageNum: number) => {
		try {
			// Only show loading state on initial load (page 0), not on pagination
			if (pageNum === 0) {
				setLoading(true);
			}
			
			const limit = 2; // Load 2 posts at a time
			const result = await RestClient.getPostsByEventId(parseInt(eventId), pageNum, limit);
			
			if (result.data) {
				const newPosts = result.data;
				
				setPosts(prev => {
					// If it's page 0, replace. Else append unique posts
					if (pageNum === 0) return newPosts;
					
					const existingIds = new Set(prev.map(p => p.id));
					const uniqueNewPosts = newPosts.filter((p: Post) => !existingIds.has(p.id));
					return [...prev, ...uniqueNewPosts];
				});
				
				// Check if there are more posts to load
				setHasMore(newPosts.length === limit);
				
				// Check which posts the user has liked (parallel requests)
			if (auth.user?.id && newPosts.length > 0) {
				const likeChecks = newPosts.map(post => 
					RestClient.checkLikePost(auth.user.id, post.id)
						.then(result => ({ postId: post.id, isLiked: result.data === true }))
						.catch(() => ({ postId: post.id, isLiked: false }))
				);
				
				const likeResults = await Promise.all(likeChecks);
				const newLikedSet = new Set<number>();
				likeResults.forEach(({ postId, isLiked }) => {
					if (isLiked) newLikedSet.add(postId);
				});
				
				setLikedPosts(prev => {
					const next = new Set(prev);
					newLikedSet.forEach(id => next.add(id));
					return next;
				});
			}
			} else {
				if (pageNum === 0) setPosts([]);
				setHasMore(false);
			}
		} catch (error) {
			console.error("Failed to fetch posts:", error);
		} finally {
			if (pageNum === 0) {
				setLoading(false);
			}
		}
	}, [eventId, auth.user?.id]);

	useEffect(() => {
		fetchPosts(page);
	}, [fetchPosts, page]);

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

			// Get public URL
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

		if (!auth.user?.id) {
			showToast("You must be logged in to post!", "error");
			return;
		}

		setIsSubmitting(true);

		try {
			// Upload image if provided
			let imageUrl: string | undefined;
			if (imageFile) {
				const uploadedUrl = await uploadImage();
				if (uploadedUrl) {
					imageUrl = uploadedUrl;
				}
			}

			const result = await RestClient.createPost(
				parseInt(eventId),
				auth.user.id,
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

	const handleDeletePost = async (postId: number) => {
		if (!auth.user?.id) {
			showToast("You must be logged in!", "error");
			return;
		}

		const confirmed = await confirm({
			title: "Delete Post",
			message: "Are you sure you want to delete this post? This will also delete all comments.",
			confirmText: "Delete",
			cancelText: "Cancel",
			variant: "danger",
		});

		if (!confirmed) return;

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

	const handleDeleteComment = async (commentId: number, postId: number, isReply: boolean = false, parentCommentId?: number) => {
		if (!auth.user?.id) {
			showToast("You must be logged in!", "error");
			return;
		}

		const confirmed = await confirm({
			title: "Delete Comment",
			message: "Are you sure you want to delete this comment?",
			confirmText: "Delete",
			cancelText: "Cancel",
			variant: "danger",
		});

		if (!confirmed) return;

		try {
			const result = await RestClient.deleteComment(commentId);
			if (result.message) {
				if (isReply && parentCommentId) {
					// Remove from replies
					setCommentReplies(prev => ({
						...prev,
						[parentCommentId]: prev[parentCommentId]?.filter(reply => reply.id !== commentId) || []
					}));
				} else {
					// Remove from post comments
					setPostComments(prev => ({
						...prev,
						[postId]: prev[postId]?.filter(comment => comment.id !== commentId) || []
					}));
				}
				// Update post comments count
				setPosts(posts.map(post => {
					if (post.id === postId) {
						return { ...post, commentsCount: Math.max(0, post.commentsCount - 1) };
					}
					return post;
				}));
				showToast("Comment deleted successfully!", "success");
			}
		} catch (error) {
			console.error("Failed to delete comment:", error);
			showToast("Failed to delete comment", "error");
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
					// Check which comments the user has liked (in parallel)
					if (auth.user?.id && result.data.length > 0) {
						const userId = auth.user.id; // Cache user ID for type safety
						const commentLikeChecks = result.data.map(comment =>
							RestClient.checkLikeComment(userId, comment.id)
								.then(likeResult => ({ commentId: comment.id, isLiked: likeResult.data === true }))
								.catch(() => ({ commentId: comment.id, isLiked: false }))
						);
						
						const likeResults = await Promise.all(commentLikeChecks);
						const newLikedComments = new Set(likedComments);
						likeResults.forEach(({ commentId, isLiked }) => {
							if (isLiked) newLikedComments.add(commentId);
						});
						setLikedComments(newLikedComments);
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
					// Add to replies of the root comment at the top
					setCommentReplies(prev => ({
						...prev,
						[actualParentId]: [result.data, ...(prev[actualParentId] || [])]
					}));
					// Auto-expand replies to show the new reply instantly
					setExpandedReplies(prev => {
						const newSet = new Set(prev);
						newSet.add(actualParentId);
						return newSet;
					});
				} else {
					// Add to comments at the top
					setPostComments(prev => ({
						...prev,
						[postId]: [result.data, ...(prev[postId] || [])]
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
			<div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-[#556b2f] to-[#6d8c3a] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
				<span className="text-white font-semibold text-sm">
					{(comment.user?.fullName || comment.user?.username || "?").charAt(0).toUpperCase()}
				</span>
			</div>
			<div className="flex-1">
				<div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-300">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-sm text-gray-900 font-(family-name:--font-dmsans)">
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
					<p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
				</div>
				<div className="flex items-center gap-4 mt-2 ml-2">
					<button
						onClick={() => handleLikeComment(comment.id, postId)}
						className={`flex items-center gap-1 text-xs font-medium ${
							likedComments.has(comment.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
						} transition-all duration-300 hover:scale-110`}
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
								rootCommentId: isReply ? rootCommentId : comment.id
							});
						}}
						className="text-xs font-medium text-gray-500 hover:text-[#556b2f] transition-colors duration-300"
					>
						Reply
					</button>
					{auth.user?.id === comment.user?.id && (
						<button
							onClick={() => handleDeleteComment(comment.id, postId, isReply, rootCommentId)}
							className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-300"
							title="Delete comment"
						>
							<IconTrash size={14} />
						</button>
					)}
					{!isReply && comment.repliesCount > 0 && (
						<button
							onClick={() => toggleReplies(comment.id)}
							className="flex items-center gap-1 text-xs text-[#556b2f] hover:text-[#6d8c3a] font-medium transition-colors duration-300"
						>
							{expandedReplies.has(comment.id) ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
							{comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
						</button>
					)}
				</div>
				
				{/* Reply input */}
				{replyingTo?.commentId === comment.id && (
					<div className="mt-3 flex gap-2 ml-2">
						<div className="w-8 h-8 bg-gradient-to-br from-[#556b2f] to-[#6d8c3a] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
							<span className="text-white font-semibold text-xs">
								{(auth.user?.username || "?").charAt(0).toUpperCase()}
							</span>
						</div>
						<div className="flex-1 flex gap-2">
							<input
								type="text"
								value={replyContent}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleSubmitComment(postId, comment.id);
									}
								}}
								onChange={(e) => setReplyContent(e.target.value)}
								placeholder={`Reply to ${comment.user?.username || 'comment'}...`}
								className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:bg-white font-(family-name:--font-dmsans)"
								autoFocus
							/>
							<button
								onClick={() => handleSubmitComment(postId, comment.id)}
								disabled={!replyContent.trim()}
								className="p-2 bg-gradient-to-r from-[#556b2f] to-[#6d8c3a] text-white rounded-full hover:from-[#6d8c3a] hover:to-[#7a9947] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 disabled:hover:scale-100"
							>
								<IconSend size={16} />
							</button>
							<button
								onClick={() => { setReplyingTo(null); setReplyContent(""); }}
								className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300"
							>
								<IconX size={16} />
							</button>
						</div>
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
		<>
		<div className="space-y-6">
			{/* Create New Post Form */}
		{auth.isAuthenticated && (
			<div className="bg-white/80 backdrop-blur-sm border-0 rounded-2xl p-6 shadow-lg overflow-hidden">
				<div className="flex gap-4">
					<div className="w-12 h-12 bg-gradient-to-br from-[#556b2f] to-[#6d8c3a] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-[#556b2f]/10">
						<span className="text-white font-bold text-lg">
							{(auth.user?.username || "?").charAt(0).toUpperCase()}
						</span>
					</div>
					<div className="flex-1">
						<textarea
							value={newPostContent}
							onChange={(e) => setNewPostContent(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									void handleSubmitPost();
								}
							}}
							placeholder="Share your thoughts about this event..."
							className="w-full p-4 border-0 bg-gray-100/80 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:bg-white text-gray-800 placeholder-gray-500 font-(family-name:--font-dmsans)"
							rows={3}
						/>
						
						{imagePreview && (
							<div className="relative mt-3 inline-block">
								<img
									src={imagePreview}
									alt="Preview"
									className="max-h-48 rounded-xl object-cover shadow-lg"
								/>
								<button
									type="button"
									onClick={clearImage}
									className="absolute -top-2 -right-2 bg-gray-800/90 text-white rounded-full p-1.5 hover:bg-gray-700 transition-colors duration-300 shadow-lg"
								>
									<IconX size={14} />
								</button>
							</div>
						)}
						
						<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
							<label className="flex items-center gap-2 text-gray-600 hover:text-[#556b2f] cursor-pointer transition-colors duration-300">
								<div className="p-2 rounded-full bg-gray-100">
									<IconPhoto size={20} />
								</div>
								<span className="text-sm font-semibold font-(family-name:--font-dmsans)">Add Photo</span>
								<input
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
							
							<button
								type="button"
								onClick={() => void handleSubmitPost()}
								disabled={isSubmitting || !newPostContent.trim()}
								className="flex items-center gap-2 bg-gradient-to-r from-[#556b2f] to-[#6d8c3a] text-white px-6 py-2.5 rounded-full hover:from-[#6d8c3a] hover:to-[#7a9947] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold font-(family-name:--font-dmsans) shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
							>
								<IconSend size={18} className={isSubmitting ? "animate-pulse" : ""} />
								{isSubmitting ? "Posting..." : "Share"}
							</button>
						</div>
					</div>
				</div>
			</div>
		)}

			{/* Discussion Posts */}
			<div className="space-y-6">
				<h3 className="font-(family-name:--font-crimson) font-medium text-2xl text-gray-900">
					Discussion
					<span className="text-[#556b2f]"> ({posts.length})</span>
				</h3>
				
			{loading && posts.length === 0 ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
				</div>
			) : posts.length === 0 ? (
					<div className="text-center py-16 animate-fadeIn">
						<div className="w-20 h-20 bg-gradient-to-br from-[#556b2f]/10 to-[#6d8c3a]/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
							<IconMessage size={36} className="text-[#556b2f]" />
						</div>
						<p className="text-gray-500 font-(family-name:--font-dmsans)">
							No posts yet. Be the first to start a discussion!
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{posts.map((post, index) => (
							<div
								key={post.id}
								ref={index === posts.length - 1 ? lastPostElementRef : null}
								className="overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 group animate-fadeIn"
								style={{ animationDelay: `${index * 100}ms` }}
							>
								{/* Hover gradient effect */}
								<div className="absolute inset-0 bg-gradient-to-br from-[#556b2f]/5 via-transparent to-[#6d8c3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
								
								{/* Post Header */}
								<div className="flex items-start gap-3 mb-3 relative">
									<div className="w-12 h-12 bg-gradient-to-br from-[#556b2f] to-[#6d8c3a] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-[#556b2f]/10 transition-transform duration-300 group-hover:scale-105">
										<span className="text-white font-bold text-lg">
											{(post.user?.fullName || post.user?.username || "?").charAt(0).toUpperCase()}
										</span>
									</div>
									<div className="flex-1">
										<p className="font-bold text-base text-gray-900 font-(family-name:--font-dmsans)">
											{post.user?.fullName || post.user?.username || "Unknown"}
										</p>
										<span className="text-sm text-gray-500 font-(family-name:--font-dmsans)">
											{formatTimeAgo(post.createdAt)}
										</span>
									</div>
									{auth.user?.id === post.user?.id && (
										<button
											onClick={() => handleDeletePost(post.id)}
											className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all duration-300"
											title="Delete post"
										>
											<IconTrash size={18} />
										</button>
									)}
								</div>

								{/* Post Content */}
								<div className="relative">
									<p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4 font-(family-name:--font-dmsans) text-[15px]">
										{post.content}
									</p>
									
									{/* Optional Image */}
									{post.imageUrl && (
										<div className="w-full overflow-hidden rounded-2xl mb-4 shadow-lg group/image">
											<img
												src={post.imageUrl}
												alt="Post attachment"
												className="w-full max-h-[500px] object-cover transition-transform duration-500 group-hover/image:scale-105"
												onError={(e) => {
													e.currentTarget.style.display = 'none';
												}}
											/>
										</div>
									)}

									{/* Stats */}
									<div className="flex items-center gap-4 text-sm text-gray-500 pb-4 border-b border-gray-100">
										{post.likesCount > 0 && (
											<span className="flex items-center gap-1.5 font-(family-name:--font-dmsans)">
												<span className="w-5 h-5 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
													<IconHeartFilled size={12} className="text-white" />
												</span>
												{post.likesCount}
											</span>
										)}
										{post.commentsCount > 0 && (
											<span className="font-(family-name:--font-dmsans)">{post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}</span>
										)}
									</div>

									{/* Action Buttons */}
									<div className="flex items-center gap-2 pt-3">
										<button
											onClick={() => handleLikePost(post.id)}
											className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold font-(family-name:--font-dmsans) transition-all duration-300 ${
												likedPosts.has(post.id)
													? "text-red-500 bg-red-50 hover:bg-red-100"
													: "text-gray-600 hover:bg-gray-100"
											}`}
										>
											{likedPosts.has(post.id) ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
											<span>{likedPosts.has(post.id) ? "Liked" : "Like"}</span>
										</button>

										<button
											onClick={() => toggleComments(post.id)}
											className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold font-(family-name:--font-dmsans) transition-all duration-300 ${
												expandedComments.has(post.id)
													? "text-[#556b2f] bg-[#556b2f]/10"
													: "text-gray-600 hover:bg-gray-100"
											}`}
										>
											<IconMessage size={18} />
											Comment
										</button>
									</div>

									{/* Comments Section */}
									{expandedComments.has(post.id) && (
										<div className="mt-4 pt-4 border-t border-gray-100 animate-slideDown">
											{/* Add Comment Input */}
											{auth.isAuthenticated && !replyingTo?.commentId && (
												<div className="flex gap-2 mb-4">
													<div className="w-8 h-8 bg-gradient-to-br from-[#556b2f] to-[#6d8c3a] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
														<span className="text-white font-semibold text-xs">
															{(auth.user?.username || "?").charAt(0).toUpperCase()}
														</span>
													</div>
													<div className="flex-1 flex gap-2">
														<input
															type="text"
															value={replyingTo?.postId === post.id && !replyingTo?.commentId ? replyContent : ""}
															onKeyDown={(e) => {
																if (e.key === 'Enter') {
																	e.preventDefault();
																	handleSubmitComment(post.id);
																}
															}}
															onChange={(e) => {
																setReplyContent(e.target.value);
																if (!replyingTo || replyingTo.postId !== post.id) {
																	setReplyingTo({ postId: post.id });
																}
															}}
															placeholder="Write a comment..."
															className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:bg-white font-(family-name:--font-dmsans) transition-all duration-300"
														/>
														<button
															onClick={() => handleSubmitComment(post.id)}
															disabled={!replyContent.trim()}
															className="p-2 bg-gradient-to-r from-[#556b2f] to-[#6d8c3a] text-white rounded-full hover:from-[#6d8c3a] hover:to-[#7a9947] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 disabled:hover:scale-100"
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

				{/* Loading indicator for infinite scroll */}
				{loading && posts.length > 0 && (
					<div className="flex justify-center py-4">
						<div className="w-8 h-8 border-2 border-[#556b2f] border-t-transparent rounded-full animate-spin"></div>
					</div>
				)}
			</div>
		</div>
		<ConfirmDialogComponent />

		{/* CSS Animations */}
		<style>{`
			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}
			@keyframes slideDown {
				from { opacity: 0; max-height: 0; }
				to { opacity: 1; max-height: 2000px; }
			}
			.animate-fadeIn {
				animation: fadeIn 0.5s ease-out forwards;
			}
			.animate-slideDown {
				animation: slideDown 0.4s ease-out forwards;
			}
		`}</style>
	</>
	);
}
