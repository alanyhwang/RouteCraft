import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProcessedRoute } from "../../helper/RouteHelpers.tsx";
import { useRoomsContext } from "../../context/RoomsContext.tsx";
import { useRouteDataContext } from "../../context/RouteDataContext.tsx";
import AnimatedButton from "../AnimatedButton.tsx";
import "../../css/AnimatedButton.css";

interface HeaderProps {
	count: number;
}

const SelectedRouteHeader = ({ count }: HeaderProps) => {
	const { selectedRooms } = useRoomsContext();
	const { setRouteData, setRoomsData } = useRouteDataContext();
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleClick = async () => {
		setIsLoading(true);
		try {
			const data = await getProcessedRoute(selectedRooms);
			setRouteData(data);
			setRoomsData(selectedRooms);
			navigate("/route");
		} catch (error) {
			console.error("Failed to process route", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<h4 style={{ textAlign: "center" }}>Selected Route ({count}/5)</h4>
			{count > 1 && (
				<div style={{ textAlign: "center", marginBottom: "1rem" }}>
					<AnimatedButton text="Make Route" onClick={handleClick} isLoading={isLoading} variant="make-route" />
				</div>
			)}
		</>
	);
};

export default SelectedRouteHeader;
