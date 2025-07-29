import "allotment/dist/style.css";
import { Allotment } from "allotment";
import MapWithMarkers from "./map-box/MapWithMarkers.tsx";
import RoomDirections from "./RoomDirections.tsx";
import "../css/RouteContent.css";

const RouteContent = () => {
	return (
		<div style={{ height: "95vh" }}>
			<Allotment vertical>
				<Allotment.Pane minSize={250} preferredSize="40%">
					<div className="route-content-top-pane">
						<RoomDirections />
					</div>
				</Allotment.Pane>
				<Allotment.Pane minSize={100}>
					<div className="route-content-panes">
						<MapWithMarkers />
					</div>
				</Allotment.Pane>
			</Allotment>
		</div>
	);
};

export default RouteContent;
