import { createContext, useContext } from "react";
import type { Room } from "../components/Room.tsx";

export interface RoomsContextType {
	allRooms: Room[];
	selectedRooms: Room[];
	setSelectedRooms: (rooms: Room[]) => void;
	addToSelectedRooms: (room: Room) => void;
	removeFromSelectedRooms: (roomShortName: string) => void;
	isSelectedRoom: (roomShortName: string) => boolean;
	selectedSingleRoom: Room | null;
	setSelectedSingleRoom: (room: Room | null) => void;
}

export const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export const useRoomsContext = (): RoomsContextType => {
	const context = useContext(RoomsContext);
	if (!context) {
		throw new Error("useRoomsContext must be used within a RoomsProvider");
	}
	return context;
};
