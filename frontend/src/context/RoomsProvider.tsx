import { type ReactNode, useEffect, useState } from "react";
import type { Room } from "../components/room/Room.tsx";
import { RoomsContext, type RoomsContextType } from "./RoomsContext.tsx";
import exampleRoomData from "../../data/testroomdatafull.json";

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = ({ children }: RoomsProviderProps) => {
	const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
	const [selectedSingleRoom, setSelectedSingleRoom] = useState<Room | null>(null);
	const [allRooms, setAllRooms] = useState<Room[]>([]);

	useEffect(() => {
		const storedSelectedRooms = localStorage.getItem("storedSelectedRooms");

		if (storedSelectedRooms) setSelectedRooms(JSON.parse(storedSelectedRooms));
	}, []);

	useEffect(() => {
		setAllRooms(exampleRoomData.result);
	}, []);

	useEffect(() => {
		localStorage.setItem("storedSelectedRooms", JSON.stringify(selectedRooms));
	}, [selectedRooms]);

	const addToSelectedRooms = (room: Room): void => {
		setSelectedRooms((prev) => {
			if (prev.length >= 5) {
				alert("Maximum 5 rooms in a route");
				return prev;
			}

			if (prev.some((r) => r.rooms_name === room.rooms_name)) {
				return prev;
			}

			return [...prev, room];
		});
	};

	const removeFromSelectedRooms = (roomName: string): void => {
		setSelectedRooms((prev) => {
			const updated = prev.filter((room) => room.rooms_name !== roomName);

			if (selectedSingleRoom?.rooms_name === roomName) {
				setSelectedSingleRoom(null);
			}

			return updated;
		});
	};

	const isSelectedRoom = (roomName: string): boolean => {
		return selectedRooms.some((room) => room.rooms_name === roomName);
	};

	const value: RoomsContextType = {
		allRooms,
		selectedRooms,
		setSelectedRooms,
		addToSelectedRooms,
		removeFromSelectedRooms,
		isSelectedRoom,
		selectedSingleRoom,
		setSelectedSingleRoom,
	};
	return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
};
