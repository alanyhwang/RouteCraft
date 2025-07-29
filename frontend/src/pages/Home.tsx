import "bootstrap/dist/css/bootstrap.min.css";
import HomeContent from "../components/HomeContent.tsx";

const Home = () => {
	return (
		<div style={{ display: "flex", flexDirection: "column", height: "94vh" }}>
			<HomeContent />
		</div>
	);
};

export default Home;
