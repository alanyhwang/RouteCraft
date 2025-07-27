import type { Room } from "./Room";
import RoomDetails from "./RoomDetails";
import React from "react";

interface Props {
	rooms: Room[];
}

const BuildingDetails: React.FC<Props> = ({ rooms }) => {
	return (
		<div style={{ padding: "1rem", background: "#f8f8f8", borderTop: "1px solid #ccc" }}>
			<h2>{rooms[0].rooms_fullname}</h2>
			<p>
				<strong>Address:</strong> {rooms[0].rooms_address}
			</p>
			<p>
				<strong>Total Rooms:</strong> {rooms.length}
			</p>
			<hr />
			{rooms.map((room) => (
				<RoomDetails key={room.rooms_name} room={room} />
			))}
		</div>
	);
};

export default BuildingDetails;
