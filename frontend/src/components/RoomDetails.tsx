import React from "react";
import type { Room } from "./Room.tsx";
import { useRoomsContext } from "../context/RoomsContext.tsx";

interface Props {
	room: Room;
}

const RoomDetails: React.FC<Props> = ({ room }) => {
	const { addToSelectedRooms, isSelectedRoom } = useRoomsContext();
	const isAlreadyAdded = isSelectedRoom(room.rooms_name);

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
			<button
				onClick={() => addToSelectedRooms(room)}
				disabled={isAlreadyAdded}
				style={{
					marginTop: "0.5rem",
					padding: "0.5rem 1rem",
					cursor: isAlreadyAdded ? "not-allowed" : "pointer",
					backgroundColor: isAlreadyAdded ? "#ccc" : "#007bff",
					color: "white",
					border: "none",
					borderRadius: "4px",
				}}
			>
				{isAlreadyAdded ? "Already Added" : "Add Room"}
			</button>
		</div>
	);
};

export default RoomDetails;
