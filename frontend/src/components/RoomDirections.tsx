import { useRouteDataContext } from "../context/RouteDataContext.tsx";
import "../css/RoomDirections.css";
import RoomDetails from "./room/RoomDetails.tsx";
import DirectionArrow from "./DirectionDistanceProp.tsx";
import { formatDuration } from "../helper/RouteHelpers.tsx";

const RoomDirections = () => {
	const { routeData, roomsData } = useRouteDataContext();

	if (!routeData || !roomsData || roomsData.length < 2) {
		return (
			<div className="room-directions-container no-route">
				<h2>Go to home page and make route from at least two rooms</h2>
			</div>
		);
	}

	const totalDistance = Math.round(routeData.totalDistance);
	const totalDuration = formatDuration(routeData.totalDuration);

	return (
		<>
			<div className="room-directions-wrapper">
				<div className="route-summary">
					<div>
						Total Distance: <strong>{totalDistance} meters</strong> | Estimated Waking Time:{" "}
						<strong>{totalDuration}</strong>
					</div>
				</div>

				<div className="room-directions-container horizontal">
					{roomsData.map((room, index) => (
						<div key={room.rooms_name} className="room-direction-block">
							<div className="room-card">
								<RoomDetails room={room} detailed hideButtons={true} />
							</div>

							{index < routeData.legs.length && (
								<div className="direction-arrow-wrapper">
									<DirectionArrow distance={routeData.legs[index].distance} duration={routeData.legs[index].duration} />
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</>
	);
};

export default RoomDirections;
