import { HttpResponse, http } from "msw";
import { getSnapshotFixture } from "./fixtures";
import type { Milestone, WorkItem } from "../model/types";

function filterWorkItems(items: WorkItem[], track?: string, status?: string) {
  return items.filter((item) => {
    const byTrack = !track || item.track === track;
    const byStatus = !status || item.status === status;
    return byTrack && byStatus;
  });
}

function filterMilestones(items: Milestone[], track?: string, from?: string, to?: string) {
  return items
    .filter((item) => {
      const byTrack = !track || track === "all" || item.track === track;
      const byFrom = !from || item.date >= from;
      const byTo = !to || item.date <= to;
      return byTrack && byFrom && byTo;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

const progressHandlers = [
  http.get("/api/v1/dashboard/snapshot", () => {
    const snapshot = getSnapshotFixture();
    return HttpResponse.json(snapshot);
  }),

  http.get("/api/v1/summary", () => {
    const snapshot = getSnapshotFixture();
    return HttpResponse.json(snapshot.summary);
  }),

  http.get("/api/v1/work-items", ({ request }) => {
    const url = new URL(request.url);
    const track = url.searchParams.get("track") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const snapshot = getSnapshotFixture();
    const items = filterWorkItems(
      [...snapshot.board.planning, ...snapshot.board.generator, ...snapshot.board.orchestrator, ...snapshot.board.engine],
      track,
      status,
    );
    return HttpResponse.json({ items });
  }),

  http.get("/api/v1/milestones", ({ request }) => {
    const url = new URL(request.url);
    const track = url.searchParams.get("track") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const snapshot = getSnapshotFixture();
    const items = filterMilestones(snapshot.timeline, track, from, to);
    return HttpResponse.json({ items });
  }),
];

export const handlers = [...progressHandlers];
