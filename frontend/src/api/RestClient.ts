export class RestClient {
	static baseUrl = "http://192.168.1.94:8080";

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
}
