import { BrowserRouter, Route, Routes } from "react-router";
import LandingPage from "./LandingPage";
import NavBar from "./NavBar";
import Events from "./Events";

function App() {
	return (
		<BrowserRouter>
			<NavBar />
			<Routes>
				<Route index element={<LandingPage />} />
				<Route path="/events" element={<Events />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
