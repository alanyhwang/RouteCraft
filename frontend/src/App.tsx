import "bootstrap/dist/css/bootstrap.min.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import About from "./pages/About.tsx";
import TopMenu from "./components/TopMenu.tsx";
import RoutePage from "./pages/RoutePage.tsx";
import { Providers } from "./context/Providers.tsx";
import StarField from "./components/StarField.tsx";

const App = () => {
	return (
		<Providers>
			<TopMenu />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/route" element={<RoutePage />} />
				<Route path="/about" element={<About />} />
			</Routes>
			<StarField />
		</Providers>
	);
};

export default App;
