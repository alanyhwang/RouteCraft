import "allotment/dist/style.css";
import { Allotment } from "allotment";
import RoomDirections from "./RoomDirections.tsx";
import "../css/RouteContent.css";
import MapWithRoute from "./map-box/MapWithRoute.tsx";
import { MapInteractionProvider } from "../context/RouteMapInteractionContextProvider.tsx";

const RouteContent = () => {
	return (
		<MapInteractionProvider>
			<div style={{ height: "95vh" }}>
				<Allotment vertical>
					<Allotment.Pane minSize={450} preferredSize="40%">
						<div className="route-content-top-pane">
							<RoomDirections />
						</div>
					</Allotment.Pane>
					<Allotment.Pane minSize={100}>
						<div className="route-content-panes">
							<MapWithRoute />
						</div>
					</Allotment.Pane>
				</Allotment>
			</div>
		</MapInteractionProvider>
	);
};

export default RouteContent;
