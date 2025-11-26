import "./LandingPage.css";
import "@mantine/carousel/styles.css";
import mainImg from "../../assets/hands-unite.avif";
import logo from "../../assets/VolunteerHub.png";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useState } from "react";
import Login from "../Login/Login";
import Header from "../Header/Header";

export default function LandingPage() {
	const [isLoginOpen, setLoginOpen] = useState(false);

	return (
		<>
			<img className="logo" src={logo}></img>
			<button className="login-button" onClick={() => setLoginOpen(true)}>
				Login <IconArrowUpRight className="arrow-icon" size={13} />{" "}
			</button>
			<h1>Let's help others together.</h1>
			<div className="image-container">
				<div className="invisible-div"></div>
				<div className="green-background"></div>
				<img src={mainImg} className="demo-img"></img>
			</div>
			<hr></hr>

			{isLoginOpen && <Login setLoginOpen={setLoginOpen} />}
		</>
	);
}
