import { redLineDependencies } from "@/features/red-lines/dependencies";
import { createRedLineRoutes } from "@/features/red-lines/routes";

const handlers = createRedLineRoutes(redLineDependencies());
export const GET = handlers.preferences;
export const PUT = handlers.preferences;
