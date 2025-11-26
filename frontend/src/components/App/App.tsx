import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "../Login/Login";
import LandingPage from "../LandingPage/LandingPage";
import NavBar from "../NavBar/NavBar";
import { MantineProvider } from "@mantine/core";

function App() {
	return (
		<MantineProvider>
			<BrowserRouter>
				<NavBar />
				<Routes>
					<Route index element={<LandingPage />} />
					<Route path="/login" element={<Login />} />
				</Routes>
			</BrowserRouter>
		</MantineProvider>
	);
}

export default App;
