import RoomRoute from "./room-route/RoomRoute.tsx";
import MapWithMarkers from "./map-box/MapWithMarkers.tsx";
import BuildingDetails from "./building/BuildingDetails.tsx";
import { useState } from "react";
import type { Room } from "./room/Room.tsx";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

const HomeContent = () => {
	const [selectedBuilding, setSelectedBuilding] = useState<Room[] | null>(null);

	return (
		<div style={{ height: "100vh" }}>
			<Allotment>
				<Allotment.Pane minSize={200} preferredSize={375} snap>
					<div style={{ height: "100%", overflowY: "auto", borderRight: "1px solid #ccc" }}>
						<RoomRoute onSelectBuilding={setSelectedBuilding} />
					</div>
				</Allotment.Pane>

				<Allotment.Pane minSize={0} snap={false}>
					<div style={{ height: "100%", position: "relative" }}>
						<MapWithMarkers onSelectBuilding={setSelectedBuilding} />
					</div>
				</Allotment.Pane>

				<Allotment.Pane minSize={200} preferredSize={300} snap>
					<div style={{ height: "100%", overflowY: "auto", borderLeft: "1px solid #ccc" }}>
						{selectedBuilding ? (
							<BuildingDetails rooms={selectedBuilding} />
						) : (
							<div style={{ padding: "1rem", color: "#666", textAlign: "center" }}>Select a building</div>
						)}
					</div>
				</Allotment.Pane>
			</Allotment>
		</div>
	);
};

export default HomeContent;
