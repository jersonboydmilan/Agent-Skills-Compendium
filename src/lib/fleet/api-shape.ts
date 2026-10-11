/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { Fleet } from "./types";
import { summarise } from "./types";
import { aggregate } from "./engine";

/**
 * Response shapes for the fleet routes, in one place so the page and the API
 * cannot disagree about what a fleet looks like on the wire.
 */

export function fleetEnvelope(fleet: Fleet, options: { agents?: boolean } = {}) {
  return {
    fleet: {
      id: fleet.id,
      objective: fleet.objective,
      status: fleet.status,
      request: fleet.request,
      createdAt: fleet.createdAt,
      startedAt: fleet.startedAt,
      endedAt: fleet.endedAt,
      notices: fleet.notices,
    },
    aggregate: aggregate(fleet),
    events: fleet.events.slice(-60),
    ...(options.agents ? { agents: fleet.agents.map(summarise) } : {}),
  };
}

export function fleetListEnvelope(fleets: Fleet[]) {
  return {
    count: fleets.length,
    fleets: fleets.map((fleet) => ({
      id: fleet.id,
      objective: fleet.objective,
      status: fleet.status,
      size: fleet.agents.length,
      createdAt: fleet.createdAt,
      aggregate: aggregate(fleet),
      href: `/fleet/${fleet.id}`,
    })),
  };
}
