import { Link, NavLink } from "react-router";

const navItems = [
	{ name: "Home", path: "/home" },
	{ name: "Events", path: "/event" },
	{ name: "Newsfeed", path: "/newsfeed" },
];

const NavBar = () => {
	return (
		<nav className="font-(--font-segoe) font-semibold text-base flex items-center justify-center w-fit gap-16 fixed z-[999] -translate-x-2/4 translate-y-0 backdrop-blur-[15.7px] mx-auto px-8 py-4 rounded-full rounded-[46px] left-2/4 top-4">
			<Link to="/" className="no-underline text-[black]">Home</Link>
			<Link to="/events" className="no-underline text-[black]">Events</Link>
			<Link to="/newsfeed" className="no-underline text-[black]">News Feed</Link>
		</nav>
	);
};

export default NavBar;
