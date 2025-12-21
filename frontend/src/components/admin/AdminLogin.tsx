import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RestClient } from "../../api/RestClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { IconLock, IconUser, IconShieldCheck } from "@tabler/icons-react";
import logo from "../../assets/VolunteerHub.png";

export default function AdminLogin() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const auth = useAuth();
	const navigate = useNavigate();
	const { showToast } = useToast();

	const handleLogin = async (e?: FormEvent) => {
		e?.preventDefault();
		
		if (!username || !password) {
			showToast("Please enter username and password", "warning");
			return;
		}
		
		setIsLoading(true);
		
		try {
			const result = await RestClient.handleLogin(username, password);
			
			// Check if account is locked
			if (result.message === "ACCOUNT_LOCKED") {
				auth.setShowLockedModal(true);
				setIsLoading(false);
				return;
			}

			if (result.data && result.data.user) {
				const userData = result.data.user;
				
				// Check if user is an admin
				const rawRole = userData.role;
				const roleName = typeof rawRole === "string" 
					? rawRole 
					: (rawRole as { name?: string } | undefined)?.name ?? "";
				
				if (roleName.toUpperCase() !== "ADMIN") {
					showToast("Access denied. Admin account required.", "error");
					setIsLoading(false);
					return;
				}
				
				// Login admin
				auth.login(username, result.data.token, userData);
				showToast(`Welcome back, ${userData.username}!`, "success");
				navigate("/admin/events");
			} else {
				showToast("Login failed: " + (result.message || "Invalid credentials"), "error");
			}
		} catch (err) {
			console.error("Login error:", err);
			showToast("Login failed", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-[#556b2f]/20 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#747e59]/20 rounded-full blur-3xl"></div>
			</div>
			
			{/* Login Card */}
			<div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
				{/* Logo */}
				<div className="flex justify-center mb-6">
					<img src={logo} alt="VolunteerHub" className="h-16 w-auto" />
				</div>
				
				{/* Header */}
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 bg-[#556b2f]/30 rounded-2xl flex items-center justify-center">
							<IconShieldCheck size={32} className="text-[#9eb35b]" />
						</div>
					</div>
					<h1 className="text-3xl font-bold text-white mb-2 font-(family-name:--font-crimson)">
						Admin Access
					</h1>
				</div>
				
				{/* Login Form */}
				<form onSubmit={handleLogin} className="space-y-5">
					{/* Username */}
					<div className="relative">
						<IconUser size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Admin Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
						/>
					</div>
					
					{/* Password */}
					<div className="relative">
						<IconLock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
						/>
					</div>
					
					{/* Submit Button */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-4 bg-gradient-to-r from-[#556b2f] to-[#747e59] text-white font-semibold rounded-xl hover:from-[#6d8c3a] hover:to-[#8fa068] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
					>
						{isLoading ? (
							<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
						) : (
							<>
								<IconLock size={20} />
								Sign In
							</>
						)}
					</button>
				</form>
				
				{/* Footer */}
				<div className="mt-8 text-center">
					<button
						onClick={() => navigate("/")}
						className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
					>
						← Back
					</button>
				</div>
			</div>
		</div>
	);
}
