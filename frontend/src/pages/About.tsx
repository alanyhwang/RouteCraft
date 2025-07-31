import "../css/About.css";
const About = () => {
	return (
		<div className="about-container sketchy">
			<h3> Made By: </h3>
			<ul>
				<li>Alan Wang</li>
				<li>Kevin Lee</li>
			</ul>
			<br />
			<h3> Tech Stack: </h3>
			<div className="tech-subsection">
				<h5> Frontend:</h5>
				<ul>
					<li>React</li>
					<li>Typescript</li>
				</ul>
				<h5> Backend:</h5>
				<ul>
					<li>Node/Express</li>
					<li>Typescript</li>
					<li>NoSQL database</li>
				</ul>
			</div>
		</div>
	);
};

export default About;
