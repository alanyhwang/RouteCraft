import MapWithMarkers from "./Map";
import "bootstrap/dist/css/bootstrap.min.css";
import TopMenu from "./TopMenu";
import RoomRoute from "./RoomRoute";
import type { Room } from "./Room";
import { useState } from "react";
import BuildingDetails from "./BuildingDetails.tsx";

const App = () => {
	const [selectedBuilding, setSelectedBuilding] = useState<Room[] | null>(null);

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			<TopMenu />

			<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
				<div
					style={{
						width: "300px",
						borderRight: "1px solid #ccc",
						overflowY: "auto",
						height: "100%",
					}}
				>
					<RoomRoute />
				</div>

				<div style={{ flex: 1, position: "relative" }}>
					<MapWithMarkers onSelectBuilding={setSelectedBuilding} />
				</div>

				{selectedBuilding && (
					<div
						style={{
							width: "300px",
							borderLeft: "1px solid #ccc",
							overflowY: "auto",
							height: "100%",
						}}
					>
						<BuildingDetails rooms={selectedBuilding} />
					</div>
				)}
			</div>
		</div>
	);
};

export default App;
