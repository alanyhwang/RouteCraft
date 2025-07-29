import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Room } from "../room/Room.tsx";
import RoomDetails from "../room/RoomDetails.tsx";

interface SortableRoomProps {
	room: Room;
	isSelected: boolean;
	onClick: () => void;
	onRemove: (name: string) => void;
}

const SortableRoom: React.FC<SortableRoomProps> = ({ room, isSelected, onClick, onRemove }) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: room.rooms_name });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		marginBottom: "0.2rem",
		padding: "0.5rem",
		border: `3px solid ${isSelected ? "#007bff" : "#ccc"}`,
		borderRadius: "4px",
		backgroundColor: isSelected ? "#e7f1ff" : "#f9f9f9",
		cursor: "default",
		display: "flex",
		alignItems: "center",
	};

	return (
		<div ref={setNodeRef} style={style} onClick={onClick}>
			<div
				{...attributes}
				{...listeners}
				style={{ cursor: "grab", display: "inline-flex", alignItems: "center", marginRight: "0.5rem" }}
				aria-label="Drag handle"
			>
				<span className="material-icons" style={{ fontSize: 20, color: "#555" }}>
					drag_indicator
				</span>
			</div>
			<RoomDetails room={room} detailed showRemoveButton onRemove={() => onRemove(room.rooms_name)} />
		</div>
	);
};

export default SortableRoom;
