import { memo, useMemo, useState } from "react";
import type { DashboardTab, TrackType, WorkItem, WorkStatus } from "../model/types";
import { formatDate, getStatusLabel, getTrackLabel } from "../model/formatters";

interface KanbanBoardProps {
  itemsByTrack: Record<TrackType, WorkItem[]>;
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  onItemClick: (item: WorkItem) => void;
  onItemStatusChange: (item: WorkItem, nextStatus: WorkStatus) => void;
}

const statusOrder: WorkStatus[] = ["todo", "in_progress", "done"];
export type BoardTab = DashboardTab;

const boardTabs: Array<{ id: BoardTab; label: string }> = [
  { id: "all", label: "전체" },
  { id: "planning", label: "기획" },
  { id: "generator", label: "Generator" },
  { id: "orchestrator", label: "Orchestrator" },
  { id: "engine", label: "Engine" },
];

type StatusGroupedItems = Record<WorkStatus, WorkItem[]>;
type GroupedByTrackAndStatus = Record<TrackType, StatusGroupedItems>;

function getColumnCount(status: WorkStatus, activeTab: BoardTab, groupedByTrackAndStatus: GroupedByTrackAndStatus) {
  if (activeTab === "all") {
    return (
      groupedByTrackAndStatus.planning[status].length +
      groupedByTrackAndStatus.generator[status].length +
      groupedByTrackAndStatus.orchestrator[status].length +
      groupedByTrackAndStatus.engine[status].length
    );
  }
  return groupedByTrackAndStatus[activeTab][status].length;
}

interface TrackGroupProps {
  items: WorkItem[];
  groupKey: string;
  title: string;
  onItemClick: (item: WorkItem) => void;
  onItemDragStart: (item: WorkItem) => void;
  onItemDragEnd: () => void;
}

function groupByStatus(items: WorkItem[]) {
  return items.reduce<StatusGroupedItems>(
    (acc, item) => {
      acc[item.status].push(item);
      return acc;
    },
    {
      todo: [],
      in_progress: [],
      done: [],
    },
  );
}

function renderTrackGroup({ items, groupKey, title, onItemClick, onItemDragStart, onItemDragEnd }: TrackGroupProps) {
  return (
    <div className="track-group" key={groupKey}>
      <h4 className="track-title">{title}</h4>
      {items.length === 0 && <p className="empty-text">해당 상태의 항목이 없습니다.</p>}

      {items.map((item) => (
        <article
          className={`work-card work-card-status-${item.status} clickable-item`}
          key={item.id}
          draggable
          onDragStart={() => onItemDragStart(item)}
          onDragEnd={onItemDragEnd}
          onClick={() => onItemClick(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onItemClick(item);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <header className="work-card-header">
            <h5>{item.title}</h5>
            <span className={`status-pill status-${item.status}`}>{getStatusLabel(item.status)}</span>
          </header>
          {item.description && <p className="work-description">{item.description}</p>}
          <div className="meta-row">
            {item.owner && <span>담당: {item.owner}</span>}
            {item.dueDate && <span>마감: {formatDate(item.dueDate)}</span>}
            <span>업데이트: {formatDate(item.updatedAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export const KanbanBoard = memo(function KanbanBoard({
  itemsByTrack,
  activeTab,
  onTabChange,
  onItemClick,
  onItemStatusChange,
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<WorkItem | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<WorkStatus | null>(null);

  const groupedByTrackAndStatus = useMemo(
    () => ({
      planning: groupByStatus(itemsByTrack.planning),
      generator: groupByStatus(itemsByTrack.generator),
      orchestrator: groupByStatus(itemsByTrack.orchestrator),
      engine: groupByStatus(itemsByTrack.engine),
    }),
    [itemsByTrack],
  );

  const handleDropToStatus = (nextStatus: WorkStatus) => {
    if (!draggedItem) {
      return;
    }

    if (draggedItem.status !== nextStatus) {
      onItemStatusChange(draggedItem, nextStatus);
    }

    setDraggedItem(null);
    setDragOverStatus(null);
  };

  return (
    <section className="panel">
      <header className="section-header">
        <div>
          <h2 className="section-title">작업 현황</h2>
        </div>
      </header>

      <div className="tab-row">
        {boardTabs.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab.id ? "tab-active" : ""}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="kanban-grid">
        {statusOrder.map((status) => (
          <section
            className={`status-column status-column-${status} ${dragOverStatus === status ? "is-drag-over" : ""}`}
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStatus(status);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDropToStatus(status);
            }}
            onDragLeave={() => {
              if (dragOverStatus === status) {
                setDragOverStatus(null);
              }
            }}
          >
            <header className="status-column-header">
              <h3>
                <span className={`status-dot status-dot-${status}`} />
                {getStatusLabel(status)}
              </h3>
              <span className={`status-count status-count-${status}`}>
                {getColumnCount(status, activeTab, groupedByTrackAndStatus)}
              </span>
            </header>
            {activeTab === "all" && (
              <>
                {renderTrackGroup({
                  items: groupedByTrackAndStatus.planning[status],
                  groupKey: `planning-${status}`,
                  title: getTrackLabel("planning"),
                  onItemClick,
                  onItemDragStart: setDraggedItem,
                  onItemDragEnd: () => {
                    setDraggedItem(null);
                    setDragOverStatus(null);
                  },
                })}
                {renderTrackGroup({
                  items: groupedByTrackAndStatus.generator[status],
                  groupKey: `generator-${status}`,
                  title: getTrackLabel("generator"),
                  onItemClick,
                  onItemDragStart: setDraggedItem,
                  onItemDragEnd: () => {
                    setDraggedItem(null);
                    setDragOverStatus(null);
                  },
                })}
                {renderTrackGroup({
                  items: groupedByTrackAndStatus.orchestrator[status],
                  groupKey: `orchestrator-${status}`,
                  title: getTrackLabel("orchestrator"),
                  onItemClick,
                  onItemDragStart: setDraggedItem,
                  onItemDragEnd: () => {
                    setDraggedItem(null);
                    setDragOverStatus(null);
                  },
                })}
                {renderTrackGroup({
                  items: groupedByTrackAndStatus.engine[status],
                  groupKey: `engine-${status}`,
                  title: getTrackLabel("engine"),
                  onItemClick,
                  onItemDragStart: setDraggedItem,
                  onItemDragEnd: () => {
                    setDraggedItem(null);
                    setDragOverStatus(null);
                  },
                })}
              </>
            )}
            {activeTab !== "all" &&
              renderTrackGroup({
                items: groupedByTrackAndStatus[activeTab][status],
                groupKey: `${activeTab}-only-${status}`,
                title: getTrackLabel(activeTab),
                onItemClick,
                onItemDragStart: setDraggedItem,
                onItemDragEnd: () => {
                  setDraggedItem(null);
                  setDragOverStatus(null);
                },
              })}
          </section>
        ))}
      </div>
    </section>
  );
});
