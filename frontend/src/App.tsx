import "bootstrap/dist/css/bootstrap.min.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import About from "./pages/About.tsx";
import TopMenu from "./components/TopMenu.tsx";
import { RoomsProvider } from "./context/RoomsProvider.tsx";

const App = () => {
	return (
		<RoomsProvider>
			<TopMenu />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
			</Routes>
		</RoomsProvider>
	);
};

export default App;
