import RoomRoute from "./room-route/RoomRoute.tsx";
import MapWithMarkers from "./map-box/MapWithMarkers.tsx";
import BuildingDetails from "./building/BuildingDetails.tsx";
import { useState } from "react";
import type { Room } from "./room/Room.tsx";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import "../css/HomeContent.css";

const HomeContent = () => {
	const [selectedBuilding, setSelectedBuilding] = useState<Room[] | null>(null);

	return (
		<div className="home-content">
			<Allotment>
				<Allotment.Pane minSize={200} preferredSize={375} snap>
					<div style={{ height: "100%", overflowY: "auto" }}>
						<RoomRoute onSelectBuilding={setSelectedBuilding} />
					</div>
				</Allotment.Pane>

				<Allotment.Pane minSize={0} snap={false}>
					<div className="sketchy" style={{ height: "100%", position: "relative" }}>
						<MapWithMarkers onSelectBuilding={setSelectedBuilding} />
					</div>
				</Allotment.Pane>

				<Allotment.Pane minSize={200} preferredSize={300} snap>
					<div style={{ height: "100%", overflowY: "auto", borderLeft: "1px solid #ccc" }}>
						{selectedBuilding ? (
							<BuildingDetails rooms={selectedBuilding} />
						) : (
							<div style={{ padding: "1rem", textAlign: "center" }}>Select a building</div>
						)}
					</div>
				</Allotment.Pane>
			</Allotment>
		</div>
	);
};

export default HomeContent;
