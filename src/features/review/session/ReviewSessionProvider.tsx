"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

import {
  INITIAL_REVIEW_SESSION,
  createReviewSessionStore,
  type ReviewSessionActions,
  type ReviewSessionState,
  type ReviewSessionStore,
} from "./store";

const ReviewSessionContext = createContext<ReviewSessionStore | null>(null);

export interface ReviewSessionProviderProps {
  readonly children: ReactNode;
  /** Tests hand in their own store; the app lets the provider make one. */
  readonly store?: ReviewSessionStore;
}

/**
 * Holds the tab's one review. Mounted in the app layout, which stays mounted
 * while the signer moves from the intake to processing to the report, and is
 * thrown away on a refresh.
 */
export function ReviewSessionProvider({ children, store }: ReviewSessionProviderProps) {
  const [own] = useState(() => store ?? createReviewSessionStore());
  return <ReviewSessionContext.Provider value={own}>{children}</ReviewSessionContext.Provider>;
}

function useStore(): ReviewSessionStore {
  const store = useContext(ReviewSessionContext);
  if (!store) throw new Error("useReviewSession needs a ReviewSessionProvider above it.");
  return store;
}

const serverSnapshot = () => INITIAL_REVIEW_SESSION;

/** The session's state and the actions that change it. */
export function useReviewSession(): {
  readonly state: ReviewSessionState;
  readonly actions: ReviewSessionActions;
} {
  const store = useStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, serverSnapshot);
  return { state, actions: store.actions };
}
