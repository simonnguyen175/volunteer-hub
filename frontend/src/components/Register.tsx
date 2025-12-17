import { IconArrowUpRight, IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import logo from "../assets/VolunteerHub.png";
import mainImg from "../assets/hands-unite.jpg";

export default function Register() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "volunteer", // Default role
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Add registration logic here
		console.log("Registering with:", formData);
		// Simulate success and redirect
		navigate("/");
	};

	return (
		<div className="min-h-screen relative flex items-center justify-center overflow-hidden">
			{/* Background Image with Overlay */}
			<div 
				className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${mainImg})` }}
			>
				<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
			</div>

			{/* Glassmorphism Card */}
			<div className="relative z-10 w-full max-w-md mx-4 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-10 animate-fade-in-up">
				{/* Logo & Header */}
				<div className="flex flex-col items-center mb-8">
					<img src={logo} alt="VolunteerHub Logo" className="h-16 w-auto object-contain mb-4" />
					<h2 className="text-3xl font-bold text-[#556b2f] font-(family-name:--font-crimson)">Create Account</h2>
					<p className="text-gray-600 mt-2 text-center">Join our community of changemakers</p>
				</div>

				{/* Registration Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Full Name</label>
						<input
							type="text"
							name="fullName"
							required
							className="w-full px-5 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#556b2f] focus:ring-2 focus:ring-[#556b2f]/20 outline-none transition-all placeholder:text-gray-400"
							placeholder="John Doe"
							value={formData.fullName}
							onChange={handleChange}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
						<input
							type="email"
							name="email"
							required
							className="w-full px-5 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#556b2f] focus:ring-2 focus:ring-[#556b2f]/20 outline-none transition-all placeholder:text-gray-400"
							placeholder="john@example.com"
							value={formData.email}
							onChange={handleChange}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
							<input
								type="password"
								name="password"
								required
								className="w-full px-5 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#556b2f] focus:ring-2 focus:ring-[#556b2f]/20 outline-none transition-all placeholder:text-gray-400"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm</label>
							<input
								type="password"
								name="confirmPassword"
								required
								className="w-full px-5 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#556b2f] focus:ring-2 focus:ring-[#556b2f]/20 outline-none transition-all placeholder:text-gray-400"
								placeholder="••••••••"
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1 ml-1">I want to join as</label>
						<div className="grid grid-cols-2 gap-3 p-1 bg-white/50 rounded-xl border border-gray-200">
							<button
								type="button"
								className={`py-2 rounded-lg text-sm font-medium transition-all ${formData.role === 'volunteer' ? 'bg-[#556b2f] text-white shadow-md' : 'text-gray-600 hover:bg-white/50'}`}
								onClick={() => setFormData({ ...formData, role: 'volunteer' })}
							>
								Volunteer
							</button>
							<button
								type="button"
								className={`py-2 rounded-lg text-sm font-medium transition-all ${formData.role === 'manager' ? 'bg-[#556b2f] text-white shadow-md' : 'text-gray-600 hover:bg-white/50'}`}
								onClick={() => setFormData({ ...formData, role: 'manager' })}
							>
								Event Manager
							</button>
						</div>
					</div>

					<button
						type="submit"
						className="w-full bg-[#556b2f] hover:bg-[#445626] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
					>
						Create Account
						<IconArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
					</button>
				</form>

				{/* Divider */}
				<div className="relative flex items-center my-6">
					<div className="flex-grow border-t border-gray-300"></div>
					<span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or sign up with</span>
					<div className="flex-grow border-t border-gray-300"></div>
				</div>

				{/* Social Login */}
				<div className="grid grid-cols-2 gap-4">
					<button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-white/50 transition-colors text-gray-700 font-medium bg-white/30">
						<IconBrandGoogle size={20} /> Google
					</button>
					<button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-white/50 transition-colors text-gray-700 font-medium bg-white/30">
						<IconBrandFacebook size={20} /> Facebook
					</button>
				</div>

				{/* Login Link */}
				<div className="mt-8 text-center">
					<p className="text-gray-600">
						Already have an account?{" "}
						<Link 
							to="/?login=true" 
							className="text-[#556b2f] font-bold hover:underline"
						>
							Log in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
