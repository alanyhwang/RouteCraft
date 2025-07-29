import { useMemo } from "react";
import { useRoomsContext } from "../../context/RoomsContext";
import type { Room } from "../room/Room.tsx";
import SortableRoom from "./SortableRoom";
import SelectedRouteHeader from "./SelectedRouteHeader";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface RoomRouteProps {
	onSelectBuilding: (rooms: Room[]) => void;
}

const RoomRoute = ({ onSelectBuilding }: RoomRouteProps) => {
	const {
		allRooms,
		selectedRooms,
		selectedSingleRoom,
		setSelectedSingleRoom,
		setSelectedRooms,
		removeFromSelectedRooms,
	} = useRoomsContext();

	const sensors = useSensors(useSensor(PointerSensor));

	const roomIds = useMemo(() => selectedRooms.map((r) => r.rooms_name), [selectedRooms]);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (active.id !== over?.id) {
			const oldIndex = selectedRooms.findIndex((r) => r.rooms_name === active.id);
			const newIndex = selectedRooms.findIndex((r) => r.rooms_name === over?.id);
			setSelectedRooms(arrayMove(selectedRooms, oldIndex, newIndex));
		}
	};

	const handleRoomClick = (room: Room) => {
		const buildingRooms = allRooms.filter((r) => r.rooms_shortname === room.rooms_shortname);
		onSelectBuilding(buildingRooms);
		setSelectedSingleRoom(room);
	};

	const handleRemove = (roomName: string) => {
		removeFromSelectedRooms(roomName);
		if (selectedSingleRoom?.rooms_name === roomName) {
			setSelectedSingleRoom(null);
		}
	};

	return (
		<div style={{ padding: "1rem" }}>
			<SelectedRouteHeader count={selectedRooms.length} />

			{selectedRooms.length === 0 ? (
				<p style={{ textAlign: "center" }}>No rooms added yet.</p>
			) : (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={roomIds} strategy={verticalListSortingStrategy}>
						{selectedRooms.map((room) => (
							<SortableRoom
								key={room.rooms_name}
								room={room}
								isSelected={selectedSingleRoom?.rooms_name === room.rooms_name}
								onClick={() => handleRoomClick(room)}
								onRemove={handleRemove}
							/>
						))}
					</SortableContext>
				</DndContext>
			)}
		</div>
	);
};

export default RoomRoute;
