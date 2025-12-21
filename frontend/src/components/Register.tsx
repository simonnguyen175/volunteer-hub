import { IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestClient } from "../api/RestClient";
import { useToast } from "./ui/Toast";

interface Props {
	setRegisterOpen: (isOpen: boolean) => void;
}

export default function Register({ setRegisterOpen }: Props) {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "user",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate passwords match
		if (formData.password !== formData.confirmPassword) {
			showToast("Passwords do not match!", "error");
			return;
		}
		
		RestClient.handleRegister(
			formData.username,
			formData.email,
			formData.password,
			formData.role
		)
			.then((result) => {
				if (result.data) {
					// Registration successful - redirect to login
					showToast("Registration successful! Please log in.", "success");
					setRegisterOpen(false);
					
					// Redirect to login modal
					navigate("/?login=true");
				} else {
					// Handle error
					console.error("Registration failed:", result);
					showToast(result.message || "Registration failed. Please try again.", "error");
				}
			})
			.catch((error) => {
				console.error("Registration error:", error);
				showToast("An error occurred during registration.", "error");
			});
	};

	return (
		<>
			{/* Dark overlay */}
			<div
				className="fixed w-full h-full bg-[rgba(0,0,0,0.5)] z-[999] left-0 top-0 cursor-pointer"
				onClick={() => setRegisterOpen(false)}
			></div>

			{/* Register form */}
			<div className="fixed -translate-x-2/4 -translate-y-2/4 text-[#111] bg-[white] max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-[1000] text-center px-20 py-8 rounded-[10px] left-2/4 top-2/4 animate-(--animate-fade-up) max-h-[90vh] overflow-y-auto">
				<h1 className="text-[5rem] font-semibold mt-8 mb-[1.2rem] mx-0 font-(family-name:--font-crimson)">
					Sign up
				</h1>
				<p className="w-full text-base text-[#444] font-extralight mb-8">
					Join our community of changemakers
				</p>

				{/* Registration Form */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
					<input
						type="text"
						name="username"
						placeholder="Username"
						required
						className="w-70 text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
						value={formData.username}
						onChange={handleChange}
					/>

					<input
						type="email"
						name="email"
						placeholder="Email Address"
						required
						className="w-70 text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
						value={formData.email}
						onChange={handleChange}
					/>

					<input
						type="password"
						name="password"
						placeholder="Password"
						required
						className="w-70 text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
						value={formData.password}
						onChange={handleChange}
					/>

					<input
						type="password"
						name="confirmPassword"
						placeholder="Confirm Password"
						required
						className="w-70 text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
						value={formData.confirmPassword}
						onChange={handleChange}
					/>

					<div className="mt-2 mb-2">
						<p className="text-sm text-[#666] mb-2">I want to join as:</p>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
									formData.role === 'user' 
										? 'bg-[#747e59] text-white' 
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
								onClick={() => setFormData({ ...formData, role: 'user' })}
							>
								User
							</button>
							<button
								type="button"
								className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
									formData.role === 'host' 
										? 'bg-[#747e59] text-white' 
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
								onClick={() => setFormData({ ...formData, role: 'host' })}
							>
								Host
							</button>
						</div>
					</div>

					<button
						type="submit"
						className="w-full h-12 bg-[#747e59] text-white text-xl cursor-pointer mt-4 p-2 rounded-2xl border-[none] hover:opacity-90"
					>
						Sign up
					</button>
				</form>

				{/* Divider */}
				<div className="relative flex items-center my-6">
					<div className="flex-grow border-t border-gray-300"></div>
					<span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or sign up with</span>
					<div className="flex-grow border-t border-gray-300"></div>
				</div>

				{/* Social Login */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					<button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
						<IconBrandGoogle size={20} /> Google
					</button>
					<button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
						<IconBrandFacebook size={20} /> Facebook
					</button>
				</div>

				{/* Login Link */}
				<p className="text-base text-[#747E59]">
					Already have an account? &nbsp;
					<a 
						href="#"
						className="text-inherit underline"
						onClick={(e) => {
							e.preventDefault();
							setRegisterOpen(false);
							// Trigger login modal via URL param
							navigate("/?login=true");
						}}
					>
						Log in
					</a>
				</p>
			</div>
		</>
	);
}
