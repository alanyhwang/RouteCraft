import type { Room } from "./Room.tsx";
import { useRoomsContext } from "../../context/RoomsContext.tsx";
import "../../css/RoomDetails.css";
import AnimatedButton from "../AnimatedButton.tsx";

interface Props {
	room: Room;
	showRemoveButton?: boolean;
	onRemove?: (roomName: string) => void;
	detailed?: boolean;
	hideButtons?: boolean;
}

const RoomDetails = ({ room, showRemoveButton = false, onRemove, detailed = false, hideButtons }: Props) => {
	const { addToSelectedRooms, isSelectedRoom } = useRoomsContext();
	const isAlreadyAdded = isSelectedRoom(room.rooms_name);

	return (
		<div className="room-details-wrapper">
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
			</div>

			{!hideButtons &&
				(showRemoveButton ? (
					<AnimatedButton
						text="Remove Room"
						onClick={(e) => {
							e.stopPropagation();
							onRemove?.(room.rooms_name);
						}}
						variant="remove"
					/>
				) : (
					<AnimatedButton
						text={isAlreadyAdded ? "Already Added" : "Add Room"}
						onClick={() => addToSelectedRooms(room)}
						disabled={isAlreadyAdded}
						variant={isAlreadyAdded ? "default" : "add"}
					/>
				))}
		</div>
	);
};

export default RoomDetails;
