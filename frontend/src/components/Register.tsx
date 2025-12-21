import { IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestClient } from "../api/RestClient";
import { useToast } from "./ui/Toast";
import * as yup from "yup";

const registrationSchema = yup.object().shape({
	username: yup
		.string()
		.required("Username is required")
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username must not exceed 30 characters")
		.matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
	email: yup
		.string()
		.required("Email is required")
		.email("Please enter a valid email address"),
	password: yup
		.string()
		.required("Password is required")
		.min(6, "Password must be at least 6 characters")
		.matches(/[a-z]/, "Password must contain at least one lowercase letter")
		.matches(/[0-9]/, "Password must contain at least one number"),
	confirmPassword: yup
		.string()
		.required("Please confirm your password")
		.oneOf([yup.ref("password")], "Passwords do not match"),
});

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
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		// Clear error for this field when user starts typing
		if (errors[name]) {
			setErrors({ ...errors, [name]: "" });
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate form with Yup
		try {
			await registrationSchema.validate(formData, { abortEarly: false });
			setErrors({});
		} catch (err) {
			if (err instanceof yup.ValidationError) {
				const validationErrors: Record<string, string> = {};
				err.inner.forEach((error) => {
					if (error.path) {
						validationErrors[error.path] = error.message;
					}
				});
				setErrors(validationErrors);
				
				// Show first error in toast
				const firstError = err.inner[0]?.message || "Please fix validation errors";
				showToast(firstError, "warning");
				return;
			}
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
					<div className="flex flex-col">
						<input
							type="text"
							name="username"
							placeholder="Username"
							className={`w-70 text-base px-0 py-[0.6rem] border-b border-solid ${errors.username ? 'border-b-red-500' : 'border-b-[#bbb]'}`}
							value={formData.username}
							onChange={handleChange}
						/>
						{errors.username && <span className="text-red-500 text-xs text-left mt-1">{errors.username}</span>}
					</div>

					<div className="flex flex-col">
						<input
							type="email"
							name="email"
							placeholder="Email Address"
							className={`w-70 text-base px-0 py-[0.6rem] border-b border-solid ${errors.email ? 'border-b-red-500' : 'border-b-[#bbb]'}`}
							value={formData.email}
							onChange={handleChange}
						/>
						{errors.email && <span className="text-red-500 text-xs text-left mt-1">{errors.email}</span>}
					</div>

					<div className="flex flex-col">
						<input
							type="password"
							name="password"
							placeholder="Password"
							className={`w-70 text-base px-0 py-[0.6rem] border-b border-solid ${errors.password ? 'border-b-red-500' : 'border-b-[#bbb]'}`}
							value={formData.password}
							onChange={handleChange}
						/>
						{errors.password && <span className="text-red-500 text-xs text-left mt-1">{errors.password}</span>}
					</div>

					<div className="flex flex-col">
						<input
							type="password"
							name="confirmPassword"
							placeholder="Confirm Password"
							className={`w-70 text-base px-0 py-[0.6rem] border-b border-solid ${errors.confirmPassword ? 'border-b-red-500' : 'border-b-[#bbb]'}`}
							value={formData.confirmPassword}
							onChange={handleChange}
						/>
						{errors.confirmPassword && <span className="text-red-500 text-xs text-left mt-1">{errors.confirmPassword}</span>}
					</div>

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
