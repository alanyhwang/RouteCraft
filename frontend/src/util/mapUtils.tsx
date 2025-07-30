import mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";
import type { ProcessedRoute } from "../helper/RouteHelpers";

export function getBoundsFromRooms(rooms: { rooms_lon: number; rooms_lat: number }[]): mapboxgl.LngLatBounds {
	const bounds = new mapboxgl.LngLatBounds();

	rooms.forEach(({ rooms_lon, rooms_lat }) => {
		bounds.extend([rooms_lon, rooms_lat]);
	});

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
