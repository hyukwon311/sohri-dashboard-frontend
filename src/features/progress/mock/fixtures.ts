import type { DashboardSnapshot, Milestone, SummaryMetrics, WorkItem } from "../model/types";

const TODAY = "2026-06-07";

const planningItems: WorkItem[] = [
  {
    id: "plan-1",
    track: "planning",
    title: "요구사항 정합성 점검",
    description: "핵심 이해관계자 요구사항 우선순위 확정",
    owner: "기획팀",
    status: "in_progress",
    priority: "high",
    startDate: "2026-06-06",
    dueDate: "2026-06-10",
    updatedAt: TODAY,
  },
  {
    id: "plan-2",
    track: "planning",
    title: "진행상황 공유 지표 정의",
    description: "비개발자용 KPI 용어 정리",
    owner: "PM",
    status: "done",
    priority: "medium",
    startDate: "2026-06-01",
    dueDate: "2026-06-05",
    updatedAt: "2026-06-05",
  },
  {
    id: "plan-3",
    track: "planning",
    title: "주간 보고 템플릿 확정",
    description: "칸반과 타임라인 기준 문서화",
    owner: "기획팀",
    status: "todo",
    priority: "medium",
    startDate: "2026-06-08",
    dueDate: "2026-06-12",
    updatedAt: TODAY,
  },
];

const generatorItems: WorkItem[] = [
  {
    id: "generator-1",
    track: "generator",
    title: "프롬프트 템플릿 개선",
    description: "시나리오 생성 품질 향상 실험",
    owner: "AI 팀",
    status: "in_progress",
    priority: "high",
    startDate: "2026-06-07",
    dueDate: "2026-06-11",
    updatedAt: TODAY,
  },
];

const orchestratorItems: WorkItem[] = [
  {
    id: "orchestrator-1",
    track: "orchestrator",
    title: "저장/편집 워크플로우 정리",
    description: "연동 포인트와 예외 흐름 매핑",
    owner: "플랫폼 팀",
    status: "todo",
    priority: "medium",
    startDate: "2026-06-09",
    dueDate: "2026-06-14",
    updatedAt: TODAY,
  },
];

const engineItems: WorkItem[] = [
  {
    id: "engine-1",
    track: "engine",
    title: "대화 실행 로깅 점검",
    description: "실행 이력 샘플 수집 및 분석",
    owner: "백엔드 팀",
    status: "done",
    priority: "low",
    startDate: "2026-06-01",
    dueDate: "2026-06-03",
    updatedAt: "2026-06-03",
  },
];

const timeline: Milestone[] = [
  {
    id: "ms-1",
    track: "planning",
    title: "기획안 리뷰 완료",
    date: "2026-06-12",
    startDate: "2026-06-08",
    endDate: "2026-06-12",
    status: "todo",
    note: "경영진 피드백 반영 예정",
  },
  {
    id: "ms-2",
    track: "generator",
    title: "생성 품질 기준 1차 합의",
    date: "2026-06-11",
    startDate: "2026-06-07",
    endDate: "2026-06-11",
    status: "in_progress",
  },
  {
    id: "ms-3",
    track: "engine",
    title: "대화 실행 테스트 시나리오 확정",
    date: "2026-06-09",
    startDate: "2026-06-04",
    endDate: "2026-06-09",
    status: "done",
  },
];

function buildSummaryMetrics(): SummaryMetrics {
  const allItems = [...planningItems, ...generatorItems, ...orchestratorItems, ...engineItems];
  const doneItems = allItems.filter((item) => item.status === "done").length;
  const inProgressItems = allItems.filter((item) => item.status === "in_progress").length;
  const todoItems = allItems.filter((item) => item.status === "todo").length;

  return {
    totalItems: allItems.length,
    doneItems,
    inProgressItems,
    todoItems,
    overallCompletionRate: (doneItems / allItems.length) * 100,
    upcomingMilestoneCount: timeline.filter((milestone) => milestone.status !== "done").length,
    hasRisk: false,
    asOfDate: TODAY,
  };
}

export function getSnapshotFixture(): DashboardSnapshot {
  return {
    summary: buildSummaryMetrics(),
    board: {
      planning: planningItems,
      generator: generatorItems,
      orchestrator: orchestratorItems,
      engine: engineItems,
    },
    timeline,
  };
}
