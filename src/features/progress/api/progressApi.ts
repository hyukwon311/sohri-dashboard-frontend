import { apiClient } from "../../../shared/api/client";
import type {
  DashboardSnapshot,
  MilestonesResponse,
  SummaryMetrics,
  TrackType,
  WorkItemsResponse,
  WorkStatus,
} from "../model/types";

interface WorkItemsParams {
  track?: TrackType;
  status?: WorkStatus;
}

interface MilestonesParams {
  track?: TrackType | "all";
  from?: string;
  to?: string;
}

export async function getDashboardSnapshot() {
  const { data } = await apiClient.get<DashboardSnapshot>("/api/v1/dashboard/snapshot");
  return data;
}

export async function getSummary() {
  const { data } = await apiClient.get<SummaryMetrics>("/api/v1/summary");
  return data;
}

export async function getWorkItems(params: WorkItemsParams = {}) {
  const { data } = await apiClient.get<WorkItemsResponse>("/api/v1/work-items", { params });
  return data;
}

export async function getMilestones(params: MilestonesParams = {}) {
  const { data } = await apiClient.get<MilestonesResponse>("/api/v1/milestones", { params });
  return data;
}
