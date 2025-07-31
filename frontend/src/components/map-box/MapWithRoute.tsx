import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import MapboxMap, { type MapRef, Marker, Layer, Source } from "react-map-gl/mapbox";
import {
	getBoundsFromRooms,
	createRouteGeoJson,
	createHighlightLegStyle,
	getBoundsFromCoordinates,
} from "../../util/mapUtils.tsx";
import { lineLayerStyle } from "../../constants/MapStyles.tsx";
import Pin from "./Pin.tsx";

import { useRouteDataContext } from "../../context/RouteDataContext.tsx";
import { useMapInteraction } from "../../context/RouteMapInteractionContext.tsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/yinghsu/cmdl2nlmk008s01rh9j8x36r5";

const MapWithRoute = () => {
	const mapRef = useRef<MapRef>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [zoom, setZoom] = useState(16);
	const [mapLoaded, setMapLoaded] = useState(false);
	const { routeData, roomsData } = useRouteDataContext();
	const { interaction } = useMapInteraction();

	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver(() => {
			mapRef.current?.resize();
		});

		resizeObserver.observe(containerRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		if (!mapLoaded || !roomsData?.length || !mapRef.current) return;

		const bounds = getBoundsFromRooms(roomsData);

		mapRef.current.fitBounds(bounds, {
			padding: 50,
			duration: 1000,
			pitch: 50,
		});
	}, [mapLoaded, roomsData]);

	useEffect(() => {
		if (!mapLoaded || !mapRef.current || !interaction) return;

		if (interaction.type === "room") {
			mapRef.current.flyTo({
				center: interaction.coordinate,
				zoom: 17,
				pitch: 50,
				duration: 500,
			});
		} else if (interaction.type === "leg") {
			const leg = routeData!.legs[interaction.index!];
			const bounds = getBoundsFromCoordinates(leg.coordinates);
			mapRef.current.fitBounds(bounds, {
				padding: 100,
				duration: 400,
				pitch: 50,
			});
		}
	}, [interaction, mapLoaded]);

	const routeGeoJson = useMemo(() => createRouteGeoJson(routeData), [routeData]);

	return (
		<div ref={containerRef} style={{ width: "100%", height: "100%" }}>
			<MapboxMap
				ref={mapRef}
				mapboxAccessToken={MAPBOX_TOKEN}
				initialViewState={{
					longitude: -123.2501,
					latitude: 49.2637,
					zoom: 15,
					pitch: 50,
				}}
				maxZoom={18}
				mapStyle={MAP_STYLE}
				onMove={(evt) => setZoom(evt.viewState.zoom)}
				onLoad={() => setMapLoaded(true)}
				style={{ width: "100%", height: "100%" }}
			>
				{roomsData?.map((room, i) => (
					<Marker key={`room-${i}`} longitude={room.rooms_lon} latitude={room.rooms_lat} anchor="bottom">
						<Pin zoom={zoom} />
					</Marker>
				))}

				{mapLoaded && routeGeoJson.features.length > 0 && (
					<Source id="route" type="geojson" data={routeGeoJson}>
						<Layer {...lineLayerStyle} />
					</Source>
				)}

				{interaction?.type === "leg" && routeData?.legs?.[interaction.index!] && (
					<Source
						id="highlight-leg"
						type="geojson"
						data={{
							type: "Feature",
							geometry: {
								type: "LineString",
								coordinates: routeData.legs[interaction.index!].coordinates,
							},
							properties: {},
						}}
					>
						<Layer {...createHighlightLegStyle("#003dff", 6)} />
					</Source>
				)}
			</MapboxMap>
		</div>
	);
};

export default MapWithRoute;
