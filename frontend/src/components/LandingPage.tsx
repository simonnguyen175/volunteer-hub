import mainImg from "../assets/hands-unite.avif";
import logo from "../assets/VolunteerHub.png";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useState } from "react";
import Login from "./Login";
import Header from "./Header";

export default function LandingPage() {
	const [isLoginOpen, setLoginOpen] = useState(false);

	return (
		<>
			<Header />

			<h1 className="relative font-(family-name:--font-crimson) font-medium top-10 text-[5rem] text-center m-4">
				Let's help others together.
			</h1>

			{/* Hands on hands image */}
			<div className="flex flex-col items-center relative h-[70vh] w-full mt-8 animate-(--animate-fade-up)">
				<div className="h-[30%] w-auto shrink-0"></div>
				<div className="relative h-4/5 w-[80vw] bg-[#8e9c78] mx-auto my-0 px-20 py-0 rounded-[36px]"></div>
				<img
					src={mainImg}
					className="absolute -translate-x-2/4 h-[90%] w-auto shadow-[0_0px_90px_rgba(0,0,0,0.2)] z-10 rounded-[16px_16px_0px_0px] left-2/4 bottom-0"
				></img>
			</div>
			<div className="flex flex-col items-center relative h-[70vh] w-full mt-8">
				<div className="h-[30%] w-auto shrink-0"></div>
				<div className="relative h-4/5 w-[80vw] bg-[#8e9c78] mx-auto my-0 px-20 py-0 rounded-[36px]"></div>
				<img
					src={mainImg}
					className="absolute -translate-x-2/4 h-[90%] w-auto shadow-[0_0px_90px_rgba(0,0,0,0.2)] z-10 rounded-[16px_16px_0px_0px] left-2/4 bottom-0"
				></img>
			</div>
			<hr></hr>
		</>
	);
}
