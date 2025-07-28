import React from "react";
import "../css/pin.css";

interface PinProps {
	backgroundColor?: string;
	color?: string;
}

const Pin: React.FC<PinProps> = ({ backgroundColor = "#d00", color = "white" }) => {
	return (
		<div className="pin" style={{ backgroundColor, color }}>
			<span className="material-icons">place</span>
		</div>
	);
};

export default React.memo(Pin);
