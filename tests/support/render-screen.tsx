import { render, type RenderResult } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";

/**
 * Renders a screen with the router context Next would provide, so `<Link>`
 * behaves as it does in the app. The recorded navigations are there for a
 * test that needs to assert one; nothing here stands in for application code.
 */
export interface ScreenRender extends RenderResult {
  readonly navigations: string[];
}

export function renderScreen(ui: ReactElement): ScreenRender {
  const navigations: string[] = [];

  const router: AppRouterInstance = {
    bfcacheId: "test",
    back: () => {},
    forward: () => {},
    refresh: () => {},
    push: (href: string) => {
      navigations.push(href);
    },
    replace: (href: string) => {
      navigations.push(href);
    },
    prefetch: () => {},
  };

  const result = render(
    <AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>,
  );

  return Object.assign(result, { navigations });
}
