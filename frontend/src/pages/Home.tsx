import "bootstrap/dist/css/bootstrap.min.css";
import Content from "../components/Content.tsx";

const Home = () => {
	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			<Content />
		</div>
	);
};

export default Home;
