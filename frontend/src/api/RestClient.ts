import { API_BASE_URL } from "@/config/api";

export class RestClient {
	static baseUrl = API_BASE_URL;

	// Helper method to get auth token
	private static getAuthToken(): string | null {
		return localStorage.getItem("token");
	}

	// Helper method to create headers with auth
	private static getHeaders(includeAuth: boolean = false): HeadersInit {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};
		
		if (includeAuth) {
			const token = this.getAuthToken();
			console.log("Token from localStorage:", token ? `${token.substring(0, 20)}...` : "NO TOKEN FOUND");
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}
		}
		
		return headers;
	}

	// ========== AUTH APIs ==========
	
	static async handleLogin(username: string, password: string): Promise<any> {
		const url = `${RestClient.baseUrl}/auth/login`;

		const body = {
			username: username,
			password: password,
		};

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(body),
		});

		return await result.json();
	}

	static async handleRegister(
		username: string,
		email: string,
		password: string,
		role: string
	): Promise<any> {
		const url = `${RestClient.baseUrl}/auth/register`;

		const body = {
			username: username,
			email: email,
			password: password,
			role: role.toUpperCase(),
		};

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(body),
		});

		return await result.json();
	}

	// ========== EVENT APIs ==========

	static async getEvents(): Promise<any> {
		const url = `${RestClient.baseUrl}/event`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(),
		});

		return await result.json();
	}

	static async getAllEventsForAdmin(): Promise<any> {
		const url = `${RestClient.baseUrl}/event/admin/all`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async searchEvents(query?: string, type?: string): Promise<any> {
		const params = new URLSearchParams();
		if (query) params.append("q", query);
		if (type) params.append("type", type);
		
		const url = `${RestClient.baseUrl}/event/search/?${params.toString()}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(),
		});

		return await result.json();
	}

	static async createEvent(eventData: {
		managerId: number;
		type: string;
		title: string;
		startTime: string;
		endTime: string;
		location: string;
		description: string;
		imageUrl: string;
	}): Promise<any> {
		const url = `${RestClient.baseUrl}/event/create`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
			body: JSON.stringify(eventData),
		});

		return await result.json();
	}

	static async updateEvent(id: number, eventData: {
		type: string;
		title: string;
		location: string;
		startTime: string;
		endTime: string;
		description: string;
		imageUrl: string;
	}): Promise<any> {
		const url = `${RestClient.baseUrl}/event/${id}`;

		const result = await fetch(url, {
			method: "PUT",
			headers: this.getHeaders(true),
			body: JSON.stringify(eventData),
		});

		return await result.json();
	}

	static async acceptEvent(id: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event/${id}/accept`;

		const result = await fetch(url, {
			method: "PATCH",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async deleteEvent(id: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event/${id}`;

		const result = await fetch(url, {
			method: "DELETE",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	// ========== USER APIs ==========

	static async getAllUsers(): Promise<any> {
		const url = `${RestClient.baseUrl}/user`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async searchUsers(query: string): Promise<any> {
		const url = `${RestClient.baseUrl}/user/search/?q=${encodeURIComponent(query)}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async updateUserRole(id: number, role: string): Promise<any> {
		const url = `${RestClient.baseUrl}/user/${id}/?role=${role}`;

		const result = await fetch(url, {
			method: "PATCH",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async toggleUserLock(id: number): Promise<any> {
		const url = `${RestClient.baseUrl}/user/${id}/(un)lock`;

		const result = await fetch(url, {
			method: "PATCH",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async deleteUser(id: number): Promise<any> {
		const url = `${RestClient.baseUrl}/user/${id}`;

		const result = await fetch(url, {
			method: "DELETE",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	// ========== EVENT-USER APIs ==========

	static async joinEvent(userId: number, eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/register/?user_id=${userId}&event_id=${eventId}`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async acceptUserToEvent(eventUserId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/accept/?event-user_id=${eventUserId}`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async denyUserToEvent(eventUserId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/deny/?event-user_id=${eventUserId}`;

		const result = await fetch(url, {
			method: "DELETE",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async leaveEvent(userId: number, eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/leave/?user_id=${userId}&event_id=${eventId}`;

		const result = await fetch(url, {
			method: "DELETE",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	// ========== NOTIFICATION APIs ==========

	static async getUserNotifications(userId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/notifications/${userId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getUnreadNotificationCount(userId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/notifications/count/${userId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async markNotificationAsRead(notificationId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/notifications/read/${notificationId}`;
		const headers = this.getHeaders(true);
		

		const result = await fetch(url, {
			method: "PUT",
			headers: headers,
		});

		if (!result.ok) {
			const error = await result.text();
			console.error('Failed to mark notification as read:', error);
			throw new Error(`Failed to mark notification as read: ${result.status}`);
		}

		return await result.json();
	}

	static async subscribeToPushNotifications(userId: number, subscription: any): Promise<any> {
		const url = `${RestClient.baseUrl}/notifications/subscribe/${userId}`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
			body: JSON.stringify(subscription),
		});

		return await result.json();
	}

	static async sendPushNotification(userId: number, content: string, link: string): Promise<any> {
		const url = `${RestClient.baseUrl}/notifications/push`;

		const body = {
			userId: userId,
			content: content,
			link: link,
		};

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
			body: JSON.stringify(body),
		});

		return await result.json();
	}

	// ========== NEW EVENT APIs ==========

	static async getEventById(eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event/${eventId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(),
		});

		return await result.json();
	}

	static async getHostedEvents(userId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event/hosted/${userId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	// ========== NEW EVENT-USER APIs ==========

	static async getJoinedEvents(userId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/joined/${userId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getPendingEvents(userId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/pending/${userId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getEventParticipants(eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/event/${eventId}/participants`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getPendingParticipants(eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/event/${eventId}/pending`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getAcceptedParticipants(eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/event/${eventId}/accepted`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getUserEventStatus(userId: number, eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/event-user/status?user_id=${userId}&event_id=${eventId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		const jsonResponse = await result.json();
		console.log("getUserEventStatus raw response:", jsonResponse);
		return jsonResponse;
	}

	// ========== POST APIs ==========

	static async getPostsByEventId(eventId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/post/by-event/?event_id=${eventId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async createPost(eventId: number, userId: number, content: string, imageUrl?: string): Promise<any> {
		const url = `${RestClient.baseUrl}/post/create`;

		const body = {
			eventId,
			userId,
			content,
			imageUrl: imageUrl || null,
		};

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
			body: JSON.stringify(body),
		});

		return await result.json();
	}

	// ========== COMMENT APIs ==========

	static async getCommentsByPostId(postId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/comment/byPost/${postId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async getRepliesByCommentId(parentId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/comment/byParent/${parentId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async createComment(postId: number, userId: number, content: string, parentCommentId?: number): Promise<any> {
		const url = `${RestClient.baseUrl}/comment/create`;

		const body = {
			postId,
			userId,
			content,
			parentCommentId: parentCommentId || 0,
		};

		console.log("Creating comment with body:", body);

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
			body: JSON.stringify(body),
		});

		return await result.json();
	}

	// ========== LIKE APIs ==========

	static async toggleLikePost(userId: number, postId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/like/post?user_id=${userId}&post_id=${postId}`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async toggleLikeComment(userId: number, commentId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/like/comment?user_id=${userId}&comment_id=${commentId}`;

		const result = await fetch(url, {
			method: "POST",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async checkLikePost(userId: number, postId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/like/post/check?user_id=${userId}&post_id=${postId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}

	static async checkLikeComment(userId: number, commentId: number): Promise<any> {
		const url = `${RestClient.baseUrl}/like/comment/check?user_id=${userId}&comment_id=${commentId}`;

		const result = await fetch(url, {
			method: "GET",
			headers: this.getHeaders(true),
		});

		return await result.json();
	}
}
