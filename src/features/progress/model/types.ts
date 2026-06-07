export type LayerComponent = "generator" | "orchestrator" | "engine";
export type TrackType = "planning" | LayerComponent;
export type WorkStatus = "todo" | "in_progress" | "done";
export type DashboardTab = "all" | TrackType;

export interface SummaryMetrics {
  totalItems: number;
  doneItems: number;
  inProgressItems: number;
  todoItems: number;
  overallCompletionRate: number;
  upcomingMilestoneCount: number;
  hasRisk: boolean;
  asOfDate: string;
}

export interface WorkItem {
  id: string;
  track: TrackType;
  title: string;
  description?: string;
  owner?: string;
  status: WorkStatus;
  priority?: "low" | "medium" | "high";
  startDate?: string;
  dueDate?: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  track: TrackType;
  title: string;
  date: string;
  startDate?: string;
  endDate?: string;
  status: WorkStatus;
  note?: string;
}

export interface DashboardSnapshot {
  summary: SummaryMetrics;
  board: Record<TrackType, WorkItem[]>;
  timeline: Milestone[];
}

export interface WorkItemsResponse {
  items: WorkItem[];
}

export interface MilestonesResponse {
  items: Milestone[];
}
