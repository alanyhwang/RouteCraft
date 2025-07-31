import "../css/StarField.css";

const generateBoxShadows = (count: number, max: number) => {
	const shadows: string[] = [];
	for (let i = 0; i < count; i++) {
		const x = Math.floor(Math.random() * max);
		const y = Math.floor(Math.random() * max);
		shadows.push(`${x}px ${y}px #FFF`);
	}
	return shadows.join(", ");
};

const StarField = () => {
	const smallStars = generateBoxShadows(700, 2000);
	const mediumStars = generateBoxShadows(200, 2000);
	const bigStars = generateBoxShadows(100, 2000);

	return (
		<div className="starfield-container">
			<div className="stars" style={{ boxShadow: smallStars }} />
			<div className="stars after" style={{ boxShadow: smallStars }} />

			<div className="stars2" style={{ boxShadow: mediumStars }} />
			<div className="stars2 after" style={{ boxShadow: mediumStars }} />

			<div className="stars3" style={{ boxShadow: bigStars }} />
			<div className="stars3 after" style={{ boxShadow: bigStars }} />
		</div>
	);
};

export default StarField;
