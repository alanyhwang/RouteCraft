import mapboxgl, { type LineLayerSpecification } from "mapbox-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";
import type { ProcessedRoute } from "../helper/RouteHelpers";
import type { Coordinate } from "../components/room/Room.tsx";

export function getBoundsFromRooms(rooms: { rooms_lon: number; rooms_lat: number }[]): mapboxgl.LngLatBounds {
	const bounds = new mapboxgl.LngLatBounds();

	rooms.forEach(({ rooms_lon, rooms_lat }) => {
		bounds.extend([rooms_lon, rooms_lat]);
	});

	return bounds;
}

export function getBoundsFromCoordinates(coordinates: Coordinate[]): mapboxgl.LngLatBounds {
	const bounds = new mapboxgl.LngLatBounds();

	coordinates.forEach((coordinate) => bounds.extend(coordinate));

	return bounds;
}

export function createRouteGeoJson(routeData: ProcessedRoute | null): FeatureCollection<LineString> {
	const features: Feature<LineString>[] =
		routeData?.legs?.map((leg, index) => ({
			type: "Feature",
			properties: { id: index },
			geometry: {
				type: "LineString",
				coordinates: leg.coordinates,
			},
		})) ?? [];

	return {
		type: "FeatureCollection",
		features,
	};
}

export function createSingleLegFeature(routeData: ProcessedRoute | null, index: number): Feature<LineString> | null {
	const leg = routeData?.legs?.[index];
	if (!leg) return null;

	return {
		type: "Feature",
		properties: {},
		geometry: {
			type: "LineString",
			coordinates: leg.coordinates,
		},
	};
}

export const createHighlightLegStyle = (color = "#ffa500", width = 6): LineLayerSpecification => ({
	id: "highlighted-leg",
	type: "line",
	source: "highlight-leg",
	layout: {
		"line-join": "round",
		"line-cap": "round",
	},
	paint: {
		"line-color": color,
		"line-width": width,
		"line-opacity": 1,
	},
});

export function getMidpoint(a: Coordinate, b: Coordinate): Coordinate {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
