import type { Room } from "../room/Room.tsx";
import RoomDetails from "../room/RoomDetails.tsx";

interface Props {
	rooms: Room[];
}

const BuildingDetails = ({ rooms }: Props) => {
	return (
		<div style={{ padding: "1rem", borderTop: "1px solid #ccc" }}>
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
