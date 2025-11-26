import { Link, NavLink } from "react-router";
import "./NavBar.css";

const navItems = [
	{ name: "Home", path: "/home" },
	{ name: "Events", path: "/event" },
	{ name: "Newsfeed", path: "/newsfeed" },
];

const NavBar = () => {
	return (
		<nav className="container">
			<Link to="/">Home</Link>
			<Link to="/events">Events</Link>
			<Link to="/newsfeed">News Feed</Link>
		</nav>
	);
};

export default NavBar;
