import type { LineLayerSpecification } from "mapbox-gl";

export const lineLayerStyle: LineLayerSpecification = {
	id: "route-line",
	type: "line",
	source: "route",
	layout: {
		"line-join": "round",
		"line-cap": "round",
	},
	paint: {
		"line-color": "#ea2323",
		"line-width": 10,
	},
};
