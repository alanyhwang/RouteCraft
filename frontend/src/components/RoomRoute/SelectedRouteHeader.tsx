import React from "react";

interface HeaderProps {
	count: number;
	onMakeRoute: () => void;
}

const SelectedRouteHeader: React.FC<HeaderProps> = ({ count, onMakeRoute }) => (
	<>
		<h4 style={{ textAlign: "center" }}>Selected Route ({count}/5)</h4>
		{count > 1 && (
			<div style={{ textAlign: "center", marginBottom: "1rem" }}>
				<button
					style={{
						padding: "0.5rem 1rem",
						backgroundColor: "#28a745",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
					onClick={onMakeRoute}
				>
					Make Route
				</button>
			</div>
		)}
	</>
);

export default SelectedRouteHeader;
