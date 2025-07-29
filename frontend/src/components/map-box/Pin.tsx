import React from "react";
import "../../css/Pin.css";

interface PinProps {
	zoom: number;
	backgroundColor?: string;
	color?: string;
}

const Pin: React.FC<PinProps> = ({ zoom, backgroundColor = "#d00", color = "white" }) => {
	const size = Math.max(1, Math.min(27, zoom * 2));

	const style = {
		width: `${size}px`,
		height: `${size}px`,
		backgroundColor: backgroundColor,
		color: color,
		fontSize: `${size * 0.6}px`,
	};

	return (
		<div className="pin" style={style}>
			<span className="material-icons">place</span>
		</div>
	);
};

export default React.memo(Pin);
