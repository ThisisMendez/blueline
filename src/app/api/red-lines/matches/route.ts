import { redLineDependencies } from "@/features/red-lines/dependencies";
import { createRedLineRoutes } from "@/features/red-lines/routes";

export const POST = createRedLineRoutes(redLineDependencies()).matches;
export const maxDuration = 120;
