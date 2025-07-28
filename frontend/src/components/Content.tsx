import RoomRoute from "./RoomRoute.tsx";
import MapWithMarkers from "./MapBox.tsx";
import BuildingDetails from "./BuildingDetails.tsx";
import { useState } from "react";
import type { Room } from "./Room.tsx";
import { RoomsProvider } from "../context/RoomsProvider.tsx";

const Content = () => {
	const [selectedBuilding, setSelectedBuilding] = useState<Room[] | null>(null);

	return (
		<RoomsProvider>
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
		</RoomsProvider>
	);
};

export default Content;
