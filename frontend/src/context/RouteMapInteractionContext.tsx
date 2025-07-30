import React, { createContext, useContext } from "react";
import type { Coordinate } from "../components/room/Room.tsx";

type HoverType = "room" | "leg" | null;

export interface MapInteraction {
	type: HoverType;
	index: number | null;
	permanent: boolean;
	coordinate: Coordinate;
}

interface MapInteractionContextProps {
	interaction: MapInteraction | null;
	setInteraction: React.Dispatch<React.SetStateAction<MapInteraction | null>>;
}

export const MapInteractionContext = createContext<MapInteractionContextProps | undefined>(undefined);

export const useMapInteraction = () => {
	const context = useContext(MapInteractionContext);
	if (!context) throw new Error("useMapInteraction must be used within MapInteractionProvider");
	return context;
};
