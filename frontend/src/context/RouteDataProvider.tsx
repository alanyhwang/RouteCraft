import { type ReactNode, useEffect, useState } from "react";
import type { ProcessedRoute } from "../helper/RouteHelpers.tsx";
import { RouteDataContext, type RouteDataContextType } from "./RouteDataContext.tsx";
import type { Room } from "../components/room/Room.tsx";

interface RouteDataProviderProps {
	children: ReactNode;
}

export const RouteDataProvider = ({ children }: RouteDataProviderProps) => {
	const [routeData, setRouteData] = useState<ProcessedRoute | null>(null);
	const [roomsData, setRoomsData] = useState<Room[] | null>(null);

	useEffect(() => {
		const storedRouteData = localStorage.getItem("storedRouteData");
		const storedRoomsData = localStorage.getItem("storedRoomsData");

		if (storedRouteData) setRouteData(JSON.parse(storedRouteData));
		if (storedRoomsData) setRoomsData(JSON.parse(storedRoomsData));
	}, []);

	useEffect(() => {
		localStorage.setItem("storedRouteData", JSON.stringify(routeData));
	}, [routeData]);

	useEffect(() => {
		localStorage.setItem("storedRoomsData", JSON.stringify(roomsData));
	}, [roomsData]);

	const value: RouteDataContextType = {
		routeData,
		setRouteData,
		roomsData,
		setRoomsData,
	};

	return <RouteDataContext.Provider value={value}>{children}</RouteDataContext.Provider>;
};
