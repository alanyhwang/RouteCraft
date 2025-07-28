import { type ReactNode, useEffect, useState } from "react";
import type { Room } from "../components/Room.tsx";
import { RoomsContext, type RoomsContextType } from "./RoomsContext.tsx";

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = ({ children }: RoomsProviderProps) => {
	const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);

	useEffect(() => {
		const storedSelectedRooms = localStorage.getItem("storedSelectedRooms");

		if (storedSelectedRooms) setSelectedRooms(JSON.parse(storedSelectedRooms));
	}, []);

	useEffect(() => {
		localStorage.setItem("storedSelectedRooms", JSON.stringify(selectedRooms));
	}, [selectedRooms]);

	const addToSelectedRooms = (room: Room): void => {
		setSelectedRooms((prev) => [...prev, room]);
	};

	const removeFromSelectedRooms = (roomName: string): void => {
		setSelectedRooms((prev) => prev.filter((room) => room.rooms_name !== roomName));
	};

	const isSelectedRoom = (roomName: string): boolean => {
		return selectedRooms.some((room) => room.rooms_name === roomName);
	};

	const value: RoomsContextType = {
		selectedRooms,
		addToSelectedRooms,
		removeFromSelectedRooms,
		isSelectedRoom,
	};
	return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
};
