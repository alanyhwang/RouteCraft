import { useEffect, useRef, useState } from "react";
import MapboxMap, { Marker, Popup, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Room } from "../room/Room.tsx";
import Pin from "./Pin.tsx";
import { useRoomsContext } from "../../context/RoomsContext.tsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
	onSelectBuilding?: (rooms: Room[]) => void;
}

const MapWithMarkers = ({ onSelectBuilding }: Props) => {
	const mapRef = useRef<MapRef>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [zoom, setZoom] = useState(16);
	const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
	const { allRooms, selectedSingleRoom, selectedRooms } = useRoomsContext();

	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver(() => {
			mapRef.current?.resize();
		});

		resizeObserver.observe(containerRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		if (selectedSingleRoom && mapRef.current) {
			mapRef.current.flyTo({
				center: [selectedSingleRoom.rooms_lon, selectedSingleRoom.rooms_lat],
				zoom: 17,
				essential: true,
			});
		}
	}, [selectedSingleRoom]);

	const roomsByBuilding: Map<string, Room[]> = new Map();
	for (const room of allRooms) {
		const shortname = room.rooms_shortname;
		if (!roomsByBuilding.has(shortname)) {
			roomsByBuilding.set(shortname, []);
		}
		roomsByBuilding.get(shortname)!.push(room);
	}

	return (
		<div ref={containerRef} style={{ width: "100%", height: "100%" }}>
			<MapboxMap
				ref={mapRef}
				mapboxAccessToken={MAPBOX_TOKEN}
				initialViewState={{
					longitude: -123.2526,
					latitude: 49.2649,
					zoom: 16,
					pitch: 30,
				}}
				onMove={(evt) => setZoom(evt.viewState.zoom)}
				mapStyle="mapbox://styles/yinghsu/cmdl2nlmk008s01rh9j8x36r5"
				style={{ width: "100%", height: "100%" }}
			>
				{Array.from(roomsByBuilding.entries()).map(([shortname, rooms]) => {
					const firstRoom = rooms[0];
					const isInSelectedRooms = selectedRooms.some((r) => r.rooms_shortname === shortname);
					const isSelectedBuilding = selectedSingleRoom?.rooms_shortname === shortname;
					const pinColor = isSelectedBuilding ? "#00cc66" : isInSelectedRooms ? "#005be6" : "#d00";

					return (
						<Marker
							key={firstRoom.rooms_name}
							longitude={firstRoom.rooms_lon}
							latitude={firstRoom.rooms_lat}
							anchor="top"
						>
							<div
								onClick={() => onSelectBuilding?.(rooms)}
								onMouseEnter={() => setHoveredRoom(firstRoom)}
								onMouseLeave={() => setHoveredRoom(null)}
							>
								<Pin zoom={zoom} backgroundColor={pinColor} />
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
		</div>
	);
};

export default MapWithMarkers;
