import { IconArrowUpRight } from "@tabler/icons-react";
import { useState } from "react";

import logo from "../assets/VolunteerHub.png";
import Login from "./Login";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
	const [isLoginOpen, setLoginOpen] = useState(false);
	const auth = useAuth();

	return (
		<>
			<header>
				{/* VolunteerHub logo */}
				<img
					className="absolute -top-1 left-2 h-25 w-auto"
					src={logo}
				></img>

				{/* Sign in button */}
				{auth.isAuthenticated ? (
					<div className="absolute right-8 top-6 *:text-3xl">
						<span className="font-(family-name:--font-crimson)">
							Hello,{" "}
						</span>
						<span className="font-(family-name:--font-crimson) text-lime-800 font-bold">
							{auth.username}
						</span>
					</div>
				) : (
					<button
						className="absolute font-(family-name:--font-dmsans) bg-[#556b2f] text-white text-base cursor-pointer transition-[background-color] duration-[0.3s] ease-[ease] z-[99] px-8 py-4 rounded-[50px] border-[none] right-8 top-4 hover:bg-[#8e9c78] group"
						onClick={() => {
							setLoginOpen(true);
						}}
					>
						Login{" "}
						<IconArrowUpRight
							className="inline group-hover:-translate-y-1 transition-transform duration-[0.3s] ease-[ease]"
							size={13}
						/>{" "}
					</button>
				)}
			</header>

			{isLoginOpen && <Login setLoginOpen={setLoginOpen} />}
		</>
	);
}
