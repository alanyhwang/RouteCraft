import { type ReactNode, useEffect, useState } from "react";
import type { Room } from "../components/room/Room.tsx";
import { RoomsContext, type RoomsContextType } from "./RoomsContext.tsx";
import { fetchRoomsApi } from "../api/insightApi.tsx";

interface RoomsProviderProps {
	children: ReactNode;
}

export const RoomsProvider = ({ children }: RoomsProviderProps) => {
	const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
	const [selectedSingleRoom, setSelectedSingleRoom] = useState<Room | null>(null);
	const [allRooms, setAllRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadRooms = async () => {
			try {
				setLoading(true);
				const result = await fetchRoomsApi();
				setAllRooms(result);
			} catch (err) {
				console.error("Failed to fetch rooms", err);
				setError("Failed to load rooms.");
			} finally {
				setLoading(false);
			}
		};

		loadRooms().catch((e) => {
			console.error("Unexpected uncaught error loading rooms", e);
		});
	}, []);

	useEffect(() => {
		const storedSelectedRooms = localStorage.getItem("storedSelectedRooms");

		if (storedSelectedRooms) setSelectedRooms(JSON.parse(storedSelectedRooms));
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
	return (
		<RoomsContext.Provider value={value}>
			{loading ? (
				<div>Loading rooms...</div>
			) : error ? (
				<>
					<div>{error} Refresh the page.</div> <div>{children}</div>
				</>
			) : (
				children
			)}
		</RoomsContext.Provider>
	);
};
