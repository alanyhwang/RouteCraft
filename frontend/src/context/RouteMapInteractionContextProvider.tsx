import React, { useState } from "react";
import { MapInteractionContext, type MapInteraction } from "./RouteMapInteractionContext.tsx";

export const MapInteractionProvider = ({ children }: { children: React.ReactNode }) => {
	const [interaction, setInteraction] = useState<MapInteraction | null>(null);

	return (
		<MapInteractionContext.Provider value={{ interaction, setInteraction }}>{children}</MapInteractionContext.Provider>
	);
};
