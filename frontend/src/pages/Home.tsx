import "bootstrap/dist/css/bootstrap.min.css";
import TopMenu from "../components/TopMenu.tsx";
import Content from "../components/Content.tsx";

const Home = () => {
	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			<TopMenu />
			<Content />
		</div>
	);
};

export default Home;
