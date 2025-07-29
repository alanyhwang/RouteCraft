import { formatDuration } from "../helper/RouteHelpers.tsx";
import "../css/Arrow.css";

interface DirectionArrowProps {
	distance: number;
	duration: number;
}

const DirectionArrow = ({ distance, duration }: DirectionArrowProps) => {
	return (
		<div className="direction-arrow-horizontal">
			<p>{Math.round(distance)} m</p>
			<p>{formatDuration(duration)}</p>
			<p></p>
			<div className="arrow">
				<span></span>
				<span></span>
				<span></span>
			</div>
		</div>
	);
};

export default DirectionArrow;
