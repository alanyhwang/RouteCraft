import { useRouteDataContext } from "../context/RouteDataContext.tsx";
import "../css/RoomDirections.css";
import RoomDetails from "./room/RoomDetails.tsx";
import DirectionArrow from "./DirectionDistanceProp.tsx";
import { formatDuration } from "../helper/RouteHelpers.tsx";
import { useMapInteraction } from "../context/RouteMapInteractionContext.tsx";
import { getMidpoint } from "../util/mapUtils.tsx";
import type { Coordinate } from "./room/Room.tsx";

const RoomDirections = () => {
	const { routeData, roomsData } = useRouteDataContext();
	const { setInteraction } = useMapInteraction();

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
		<div className="room-directions-wrapper">
			<div className="room-directions-container horizontal">
				{roomsData.map((room, index) => {
					const roomCoordinate: Coordinate = [room.rooms_lon, room.rooms_lat];
					const leg = routeData.legs[index];
					const hasNextLeg = index < routeData.legs.length;
					const midpoint = hasNextLeg ? getMidpoint(leg.from, leg.to) : null;

					return (
						<div
							key={room.rooms_name}
							className="room-direction-block"
							onMouseEnter={() => setInteraction({ type: "room", index, permanent: false, coordinate: roomCoordinate })}
							onMouseLeave={() => setInteraction((prev) => (prev?.permanent ? prev : null))}
							onClick={() => setInteraction({ type: "room", index, permanent: true, coordinate: roomCoordinate })}
						>
							<div className="room-card">
								<RoomDetails room={room} detailed hideButtons />
							</div>

							{hasNextLeg && midpoint && (
								<div
									className="direction-arrow-wrapper"
									onMouseEnter={() => setInteraction({ type: "leg", index, permanent: false, coordinate: midpoint })}
									onMouseLeave={() => setInteraction((prev) => (prev?.permanent ? prev : null))}
									onClick={(e) => {
										e.stopPropagation(); // prevents bubbling
										setInteraction({
											type: "leg",
											index,
											permanent: true,
											coordinate: getMidpoint(routeData.legs[index].from, routeData.legs[index].to),
										});
									}}
								>
									<DirectionArrow distance={leg.distance} duration={leg.duration} />
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="route-summary">
				<div>
					Total Distance: <strong>{totalDistance} meters</strong> | Estimated Walking Time:{" "}
					<strong>{totalDuration}</strong>
				</div>
			</div>
		</div>
	);
};

export default RoomDirections;
