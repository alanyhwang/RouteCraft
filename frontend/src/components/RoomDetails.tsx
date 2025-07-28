import React from "react";
import type { Room } from "./Room.tsx";

interface Props {
	room: Room;
}

const RoomDetails: React.FC<Props> = ({ room }) => {
	return (
		<div style={{ padding: "1rem", background: "#eee", borderTop: "1px solid #ccc" }}>
			<h5>{room.rooms_name}</h5>
			<p>
				<strong>Seats:</strong> {room.rooms_seats}
			</p>
			<p>
				<strong>Type:</strong> {room.rooms_type}
			</p>
			<p>
				<strong>Furniture:</strong> {room.rooms_furniture}
			</p>
			<a href={room.rooms_href} target="_blank" rel="noopener noreferrer">
				Link to View More Replace with Add Button
			</a>
		</div>
	);
};

export default RoomDetails;
