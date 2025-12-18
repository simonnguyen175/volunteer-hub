import { Link, useNavigate } from "react-router";
import { RestClient } from "../api/RestClient";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Props {
	setLoginOpen: (isOpen: boolean) => void;
}

export default function Login({ setLoginOpen }: Props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const auth = useAuth();
	const navigate = useNavigate();

	return (
		<>
			{/* Dark overlay */}
			<div
				className="fixed w-full h-full bg-[rgba(0,0,0,0.5)] z-[999] left-0 top-0"
				onClick={() => setLoginOpen(false)}
			></div>

			{/* Login form */}
			<div className="fixed -translate-x-2/4 -translate-y-2/4 text-[#111] bg-[white] max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-[1000] text-center px-20 py-8 rounded-[10px] left-2/4 top-2/4 animate-(--animate-fade-up)">
				<h1 className="text-[5rem] font-semibold mt-8 mb-[1.2rem] mx-0 font-(family-name:--font-crimson)">
					Log in
				</h1>
				<p className="w-full text-base text-[#444] font-extralight mb-12">
					Welcome back
				</p>

				<form className="flex flex-col gap-3 mt-4">
					<input
						type="text"
						placeholder="Username or Email"
						className="w-70 text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
						onChange={(e) => {
							setUsername(e.target.value);
						}}
						value={username}
					/>

					<div className="flex justify-between items-center">
						<input
							type="password"
							placeholder="Password"
							className="max-w-100text-base px-0 py-[0.6rem] border-b-[#bbb] border-[none] border-b border-solid"
							onChange={(e) => {
								setPassword(e.target.value);
							}}
						/>
						<Link
							to="/forgor"
							className="text-[#666] text-[0.95rem] no-underline"
						>
							Forgot?
						</Link>
					</div>
				</form>

				<button
					className="w-full h-12 bg-[#747e59] text-white text-xl cursor-pointer mt-8 p-2 rounded-2xl border-[none] hover:opacity-90"
					onClick={() => {
						RestClient.handleLogin(username, password)
							.then((result) => {
								if (result.username !== null) {
									auth.login(username);
									setLoginOpen(false);
								}
							})
					}}
				>
					Log in
				</button>

				<p className="text-base text-[#747E59] mt-6">
					Don't have an account? &nbsp;
					<a 
						href="#"
						className="text-inherit underline"
						onClick={(e) => {
							e.preventDefault();
							setLoginOpen(false);
							// Trigger register modal via URL param
							navigate("/?register=true");
						}}
					>
						Sign up
					</a>
				</p>
			</div>
		</>
	);
}
