import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProcessedRoute } from "../../helper/RouteHelpers.tsx";
import { useRoomsContext } from "../../context/RoomsContext.tsx";
import { useRouteDataContext } from "../../context/RouteDataContext.tsx";
import "../../css/Button.css";

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
					<button
						style={{
							padding: "0.5rem 1rem",
							backgroundColor: isLoading ? "#6c757d" : "#28a745",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: isLoading ? "not-allowed" : "pointer",
						}}
						onClick={handleClick}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<span className="spinner" style={{ marginRight: "0.5rem" }}>
									🔄
								</span>
								Loading Route...
							</>
						) : (
							"Make Route"
						)}
					</button>
				</div>
			)}
		</>
	);
};

export default SelectedRouteHeader;
