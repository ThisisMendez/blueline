import { productionDependencies } from "@/features/analysis/server/dependencies";
import { createAnalysisRoute } from "@/features/analysis/server/route";

/**
 * Deliberately thin. The handler and its wiring are feature code, so the same
 * handler a browser posts to is the one the test suite drives.
 */
export const POST = createAnalysisRoute(productionDependencies());

/**
 * A lease analysis can run for a minute or more. The platform ceiling sits
 * above the client's own 90-second timeout so the clean error path is the one
 * that fires, rather than the function being killed first.
 */
export const maxDuration = 120;
