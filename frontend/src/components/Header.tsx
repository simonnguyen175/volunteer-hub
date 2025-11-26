import { IconArrowUpRight } from "@tabler/icons-react";
import { useState } from "react";

import logo from "../assets/VolunteerHub.png";
import Login from "./Login";

export default function Header() {
	const [isLoginOpen, setLoginOpen] = useState(false);

	return (
		<>
			<header>
				{/* VolunteerHub logo */}
				<img
					className="absolute top-0 left-0 h-25 w-auto"
					src={logo}
				></img>

				{/* Sign in button */}
				<button
					className="absolute bg-[#556b2f] text-white text-base font-semibold cursor-pointer transition-[background-color] duration-[0.3s] ease-[ease] z-[99] px-8 py-4 rounded-[50px] border-[none] right-8 top-4 hover:bg-[#8e9c78] group"
					onClick={() => setLoginOpen(true)}
				>
					Login{" "}
					<IconArrowUpRight
						className="inline group-hover:-translate-y-1 transition-transform duration-[0.3s] ease-[ease]"
						size={13}
					/>{" "}
				</button>
			</header>

			{isLoginOpen && <Login setLoginOpen={setLoginOpen} />}
		</>
	);
}
