import type { TrackType, WorkStatus } from "./types";

const statusLabelMap: Record<WorkStatus, string> = {
  todo: "대기",
  in_progress: "진행중",
  done: "완료",
};

const trackLabelMap: Record<TrackType, string> = {
  planning: "기획 파트",
  generator: "Scenario Generator",
  orchestrator: "Scenario Orchestrator",
  engine: "Scenario Engine",
};

export function getStatusLabel(status: WorkStatus) {
  return statusLabelMap[status];
}

export function getTrackLabel(track: TrackType) {
  return trackLabelMap[track];
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
