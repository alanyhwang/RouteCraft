import { fetchRouteDirections } from "../api/mapBoxApi";
import type { Coordinate, Room } from "../components/room/Room.tsx";

export interface ProcessedRoute {
	totalDistance: number;
	totalDuration: number;
	coordinates: Coordinate[];
	legs: RouteLeg[];
}

interface RouteLeg {
	from: Coordinate;
	to: Coordinate;
	distance: number;
	duration: number;
	coordinates: Coordinate[];
}

interface RouteStep {
	geometry: {
		coordinates: Coordinate[];
	};
}

interface RouteLegRaw {
	distance: number;
	duration: number;
	steps: RouteStep[];
}

export async function getProcessedRoute(rooms: Room[]): Promise<ProcessedRoute> {
	if (rooms.length < 2 || rooms.length > 5) {
		throw new Error("Must provide between 2 and 5 rooms to create a route.");
	}

	const coords: Coordinate[] = rooms.map((room) => [room.rooms_lon, room.rooms_lat]);

	const data = await fetchRouteDirections(coords);

	const route = data.routes?.[0];
	if (!route) {
		throw new Error("No route found");
	}

	const legs: RouteLeg[] = route.legs.map((leg: RouteLegRaw, index: number) => {
		const from = coords[index];
		const to = coords[index + 1];

		const legCoords: Coordinate[] = leg.steps.flatMap((step: RouteStep) => step.geometry.coordinates);

		return {
			from,
			to,
			distance: leg.distance,
			duration: leg.duration,
			coordinates: legCoords,
		};
	});

	return {
		totalDistance: route.distance,
		totalDuration: route.duration,
		coordinates: route.geometry.coordinates,
		legs,
	};
}

export function formatDuration(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts = [];

	if (hrs > 0) parts.push(`${hrs}h`);
	if (mins > 0) parts.push(`${mins}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

	return parts.join(" ");
}
