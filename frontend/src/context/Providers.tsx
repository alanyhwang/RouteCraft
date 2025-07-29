import { RoomsProvider } from "./RoomsProvider.tsx";
import { RouteDataProvider } from "./RouteDataProvider.tsx";
import React from "react";

export const Providers = ({ children }: { children: React.ReactNode }) => (
	<RoomsProvider>
		<RouteDataProvider>{children}</RouteDataProvider>
	</RoomsProvider>
);
