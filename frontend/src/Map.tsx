import React, { useState } from "react";
import MapboxMap, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import exampleRoomData from "../data/testroomdata.json";
import type { Room } from "./Room.tsx";
import Pin from "./Pin.tsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
	onSelectBuilding: (rooms: Room[]) => void;
}

const MapWithMarkers: React.FC<Props> = ({ onSelectBuilding }) => {
	const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);

	const roomsByBuilding: Map<string, Room[]> = new Map();

	for (const room of exampleRoomData.result) {
		const shortname = room.rooms_shortname;
		if (!roomsByBuilding.has(shortname)) {
			roomsByBuilding.set(shortname, []);
		}
		roomsByBuilding.get(shortname)!.push(room);
	}

	return (
		<>
			<MapboxMap
				mapboxAccessToken={MAPBOX_TOKEN}
				initialViewState={{
					longitude: -123.25259599548394,
					latitude: 49.26487554335752,
					zoom: 16,
					pitch: 30,
				}}
				style={{ width: "100%", height: "100%", flex: 1 }}
				mapStyle="mapbox://styles/yinghsu/cmdl2nlmk008s01rh9j8x36r5"
			>
				{Array.from(roomsByBuilding.entries()).map(([, rooms]) => {
					const firstRoom = rooms[0]; // Or compute average lat/lon if needed
					return (
						<Marker
							key={firstRoom.rooms_fullname}
							longitude={firstRoom.rooms_lon}
							latitude={firstRoom.rooms_lat}
							anchor="top"
						>
							<div
								onMouseEnter={() => setHoveredRoom(firstRoom)}
								onMouseLeave={() => setHoveredRoom(null)}
								onClick={() => onSelectBuilding(rooms)}
							>
								<Pin />
							</div>
						</Marker>
					);
				})}

				{hoveredRoom && (
					<Popup
						longitude={hoveredRoom.rooms_lon}
						latitude={hoveredRoom.rooms_lat}
						closeButton={false}
						closeOnClick={false}
						anchor="bottom"
					>
						{hoveredRoom.rooms_fullname}
					</Popup>
				)}
			</MapboxMap>
		</>
	);
};

export default MapWithMarkers;
