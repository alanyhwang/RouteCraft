import type { Room } from "../components/room/Room.tsx";

const PORT = 4321;
const SERVER_URL = `http://localhost:${PORT}`;
const QUERY_ENDPOINT = "/query";

export async function fetchRoomsApi(): Promise<Room[]> {
	const input = {
		WHERE: {},
		OPTIONS: {
			COLUMNS: [
				"rooms_fullname",
				"rooms_shortname",
				"rooms_number",
				"rooms_name",
				"rooms_address",
				"rooms_lat",
				"rooms_lon",
				"rooms_seats",
				"rooms_type",
				"rooms_furniture",
				"rooms_href",
			],
		},
	};

	const response = await fetch(`${SERVER_URL}${QUERY_ENDPOINT}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch rooms: ${response.statusText}`);
	}

	const data = await response.json();
	return data.result as Room[];
}
