import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import MapboxMap, { type MapRef, Marker, Layer, Source } from "react-map-gl/mapbox";
import { getBoundsFromRooms, createRouteGeoJson } from "../../util/mapUtils.tsx";
import { lineLayerStyle } from "../../constants/mapStyles";

import { useRouteDataContext } from "../../context/RouteDataContext.tsx";
import Pin from "./Pin.tsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/yinghsu/cmdl2nlmk008s01rh9j8x36r5";

const MapWithRoute = () => {
	const mapRef = useRef<MapRef>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [zoom, setZoom] = useState(16);
	const [mapLoaded, setMapLoaded] = useState(false);
	const { routeData, roomsData } = useRouteDataContext();

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
			</MapboxMap>
		</div>
	);
};

export default MapWithRoute;
