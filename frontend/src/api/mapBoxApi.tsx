import type { Coordinate } from "../components/room/Room.tsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function fetchRouteDirections(coords: Coordinate[]) {
	if (coords.length < 2 || coords.length > 5) {
		throw new Error("Number of coordinates must be between 2 and 5");
	}

	const coordString = coords.map(([lon, lat]) => `${lon},${lat}`).join(";");

	const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordString}?alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;

	const response = await fetch(url);
	if (!response.ok) throw new Error("Failed to fetch directions");

	return await response.json();
}
