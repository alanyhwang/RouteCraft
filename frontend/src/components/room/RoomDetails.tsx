import React from "react";
import type { Room } from "./Room.tsx";
import { useRoomsContext } from "../../context/RoomsContext.tsx";

interface Props {
	room: Room;
	showRemoveButton?: boolean;
	onRemove?: (roomName: string) => void;
	detailed?: boolean;
}

const RoomDetails: React.FC<Props> = ({ room, showRemoveButton = false, onRemove, detailed = false }) => {
	const { addToSelectedRooms, isSelectedRoom } = useRoomsContext();
	const isAlreadyAdded = isSelectedRoom(room.rooms_name);

	return (
		<div style={{ padding: "1rem", background: "#eee", borderTop: "1px solid #ccc" }}>
			<h5>{room.rooms_name}</h5>

			<div>
				{detailed && (
					<>
						<div>
							<strong>Full Name:</strong> {room.rooms_fullname}
						</div>
						<div>
							<strong>Short Name:</strong> {room.rooms_shortname}
						</div>
						<div>
							<strong>Number:</strong> {room.rooms_number}
						</div>
						<div>
							<strong>Address:</strong> {room.rooms_address}
						</div>
					</>
				)}
				<div>
					<strong>Seats:</strong> {room.rooms_seats}
				</div>
				<div>
					<strong>Type:</strong> {room.rooms_type}
				</div>
				<div>
					<strong>Furniture:</strong> {room.rooms_furniture}
				</div>
				{detailed && (
					<>
						<div>
							<strong>Coordinates:</strong> {room.rooms_lat}, {room.rooms_lon}
						</div>
						<a href={room.rooms_href} target="_blank" rel="noopener noreferrer">
							View More
						</a>
					</>
				)}
			</div>

			{showRemoveButton ? (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onRemove?.(room.rooms_name);
					}}
					style={{
						marginTop: "0.5rem",
						padding: "0.5rem 1rem",
						backgroundColor: "#dc3545",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					Remove Room
				</button>
			) : (
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
			)}
		</div>
	);
};

export default RoomDetails;
