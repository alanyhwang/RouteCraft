// import MapboxMap, { type MapRef } from "react-map-gl/mapbox";
// import { useEffect, useRef, useState } from "react";
//
// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// // TODO
// const MapWithMarkers = () => {
// 	const mapRef = useRef<MapRef>(null);
// 	const containerRef = useRef<HTMLDivElement>(null);
//
// 	const [zoom, setZoom] = useState(16);
//
// 	useEffect(() => {
// 		if (!containerRef.current) return;
//
// 		const resizeObserver = new ResizeObserver(() => {
// 			mapRef.current?.resize();
// 		});
//
// 		resizeObserver.observe(containerRef.current);
// 		return () => resizeObserver.disconnect();
// 	}, []);
//
// 	return (
// 		<div>
// 			<MapboxMap
// 				ref={mapRef}
// 				mapboxAccessToken={MAPBOX_TOKEN}
// 				initialViewState={{
// 					longitude: -123.2526,
// 					latitude: 49.2649,
// 					zoom: 16,
// 					pitch: 30,
// 				}}
// 				onMove={(evt) => setZoom(evt.viewState.zoom)}
// 				mapStyle="mapbox://styles/yinghsu/cmdl2nlmk008s01rh9j8x36r5"
// 				style={{ width: "100%", height: "100%" }}
// 			></MapboxMap>
// 		</div>
// 	);
// };
