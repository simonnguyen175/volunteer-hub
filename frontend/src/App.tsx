import { BrowserRouter, Route, Routes } from "react-router";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import NewsFeed from "./components/NewsFeed";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route index element={<LandingPage />} />
					<Route path="/events" element={<Events />} />
					<Route path="/events/:eventId" element={<EventDetails />} />
					<Route path="/newsfeed" element={<NewsFeed />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
