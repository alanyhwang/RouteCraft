import { createContext, useContext } from "react";
import type { ProcessedRoute } from "../helper/RouteHelpers.tsx";
import type { Room } from "../components/room/Room.tsx";

export interface RouteDataContextType {
	routeData: ProcessedRoute | null;
	setRouteData: (data: ProcessedRoute) => void;
	roomsData: Room[] | null;
	setRoomsData: (rooms: Room[]) => void;
}

export const RouteDataContext = createContext<RouteDataContextType | undefined>(undefined);

export const useRouteDataContext = (): RouteDataContextType => {
	const context = useContext(RouteDataContext);
	if (!context) {
		throw new Error("useRouteDataContext must be used within a RouteDataProvider");
	}
	return context;
};
