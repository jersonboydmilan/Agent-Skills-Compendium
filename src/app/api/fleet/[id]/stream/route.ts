import { fleetEngine } from "@/lib/fleet/engine";
import { aggregate } from "@/lib/fleet/engine";
import { summarise } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";

/** How often the roster snapshot is pushed. Events arrive as they happen. */
const SNAPSHOT_MS = 400;

/**
 * GET /api/fleet/:id/stream — server-sent events for a live fleet.
 *
 * Two kinds of message. `event` carries the feed line as it happens, so the
 * log reads in real time. `snapshot` carries the roster and the aggregate on a
 * timer, because 500 agents changing status would otherwise mean 500 messages
 * the client coalesces anyway.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fleet = fleetEngine.get(id);
  if (!fleet) {
    return new Response(`No fleet "${id}".`, { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let snapshotTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let open = true;
      const send = (type: string, data: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          open = false;
        }
      };

      const snapshot = () => {
        const current = fleetEngine.get(id);
        if (!current) return;
        send("snapshot", {
          status: current.status,
          aggregate: aggregate(current),
          agents: current.agents.map(summarise),
          notices: current.notices,
        });
        // A settled fleet has nothing further to say.
        if (current.status === "complete" || current.status === "aborted") close();
      };

      const close = () => {
        if (!open) return;
        open = false;
        unsubscribe?.();
        if (snapshotTimer) clearInterval(snapshotTimer);
        try {
          controller.close();
        } catch {
          // Already closed by the client disconnecting.
        }
      };

      unsubscribe = fleetEngine.subscribe(id, (event) => send("event", event));
      snapshot();
      snapshotTimer = setInterval(snapshot, SNAPSHOT_MS);
      snapshotTimer.unref?.();
    },
    cancel() {
      unsubscribe?.();
      if (snapshotTimer) clearInterval(snapshotTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Without this an intermediate proxy may hold the stream in a buffer.
      "x-accel-buffering": "no",
    },
  });
}
