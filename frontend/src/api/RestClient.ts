export class RestClient {
	static baseUrl = "http://localhost:8080";

	static async handleLogin(username: string, password: string): Promise<any> {
		const url = `${RestClient.baseUrl}/auth/login`;

		const body = {
			username: username,
			password: password,
		};

		const result = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
			role: role.toUpperCase(), // Convert to uppercase (USER or HOST)
		};

		const result = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		return await result.json();
	}
}
