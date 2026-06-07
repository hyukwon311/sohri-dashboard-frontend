import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DashboardTab, WorkItem } from "../model/types";
import { formatDate, getStatusLabel, getTrackLabel } from "../model/formatters";

interface TimelinePanelProps {
  items: WorkItem[];
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onItemClick: (item: WorkItem) => void;
}

const tabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "all", label: "전체" },
  { id: "planning", label: "기획" },
  { id: "generator", label: "Generator" },
  { id: "orchestrator", label: "Orchestrator" },
  { id: "engine", label: "Engine" },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateValue(dateString: string) {
  return new Date(`${dateString}T00:00:00`).getTime();
}

function getRangeStart(item: WorkItem) {
  return item.startDate ?? item.updatedAt;
}

function getRangeEnd(item: WorkItem) {
  return item.dueDate ?? item.startDate ?? item.updatedAt;
}

function buildScaleDates(min: number, totalDays: number) {
  const ratios = [0, 0.25, 0.5, 0.75, 1];
  const positions = new Set<number>();

  ratios.forEach((ratio) => {
    positions.add(Math.round((totalDays - 1) * ratio));
  });

  return Array.from(positions)
    .sort((a, b) => a - b)
    .map((offsetDay) => {
      const timestamp = min + offsetDay * DAY_IN_MS;
      const date = new Date(timestamp);
      const label = new Intl.DateTimeFormat("ko-KR", {
        month: "2-digit",
        day: "2-digit",
      }).format(date);
      const position = totalDays <= 1 ? 0 : (offsetDay / (totalDays - 1)) * 100;

      return { offsetDay, label, position };
    });
}

export const TimelinePanel = memo(function TimelinePanel({ items, activeTab, onTabChange, onItemClick }: TimelinePanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollInnerRef = useRef<HTMLDivElement | null>(null);
  const leftRowRefs = useRef<Array<HTMLElement | null>>([]);
  const rightRowRefs = useRef<Array<HTMLElement | null>>([]);
  const [isScrollable, setIsScrollable] = useState(false);
  const [rowHeights, setRowHeights] = useState<number[]>([]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (activeTab === "all") {
          return true;
        }
        if (activeTab === "planning") {
          return item.track === "planning";
        }
        return item.track === activeTab;
      })
      .sort((a, b) => getRangeStart(a).localeCompare(getRangeStart(b)));
  }, [activeTab, items]);

  const range = useMemo(() => {
    if (filteredItems.length === 0) {
      return undefined;
    }

    const starts = filteredItems.map((item) => toDateValue(getRangeStart(item)));
    const ends = filteredItems.map((item) => toDateValue(getRangeEnd(item)));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const totalDays = Math.max(1, Math.floor((max - min) / DAY_IN_MS) + 1);

    return { min, totalDays };
  }, [filteredItems]);

  const scaleDates = useMemo(() => {
    if (!range) {
      return [];
    }
    return buildScaleDates(range.min, range.totalDays);
  }, [range]);

  const todayPosition = useMemo(() => {
    if (!range) {
      return null;
    }

    const today = toDateValue(new Date().toISOString().slice(0, 10));
    const rangeEnd = range.min + (range.totalDays - 1) * DAY_IN_MS;
    if (today < range.min || today > rangeEnd) {
      return null;
    }

    if (range.totalDays <= 1) {
      return 0;
    }

    return ((today - range.min) / DAY_IN_MS / (range.totalDays - 1)) * 100;
  }, [range]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const inner = scrollInnerRef.current;
    if (!container || !inner) {
      return;
    }

    const updateScrollable = () => {
      const shouldScroll = inner.scrollWidth - container.clientWidth > 1;
      setIsScrollable(shouldScroll);
    };

    updateScrollable();

    const observer = new ResizeObserver(updateScrollable);
    observer.observe(container);
    observer.observe(inner);

    return () => observer.disconnect();
  }, [filteredItems.length, range?.totalDays]);

  useLayoutEffect(() => {
    if (filteredItems.length === 0) {
      setRowHeights([]);
      return;
    }

    const syncRowHeights = () => {
      const nextHeights = filteredItems.map((_, index) => {
        const leftHeight = leftRowRefs.current[index]?.offsetHeight ?? 0;
        const rightHeight = rightRowRefs.current[index]?.offsetHeight ?? 0;
        return Math.max(88, leftHeight, rightHeight);
      });

      setRowHeights((prev) => {
        const hasDiff = nextHeights.length !== prev.length || nextHeights.some((height, index) => height !== prev[index]);
        return hasDiff ? nextHeights : prev;
      });
    };

    syncRowHeights();

    const observer = new ResizeObserver(syncRowHeights);
    leftRowRefs.current.forEach((row) => row && observer.observe(row));
    rightRowRefs.current.forEach((row) => row && observer.observe(row));

    return () => observer.disconnect();
  }, [filteredItems]);

  return (
    <section className="panel">
      <header className="section-header">
        <div>
          <h2 className="section-title">타임 라인</h2>
        </div>
        <div className="legend-chip-row">
          <span className="legend-chip">
            <span className="legend-dot legend-done" />
            완료
          </span>
          <span className="legend-chip">
            <span className="legend-dot legend-progress" />
            진행중
          </span>
          <span className="legend-chip">
            <span className="legend-dot legend-todo" />
            대기
          </span>
          <span className="legend-chip">
            <span className="legend-line" />
            오늘
          </span>
        </div>
      </header>

      <div className="tab-row">
        {tabs.map((tab) => (
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

      {filteredItems.length === 0 && <p className="empty-text">조건에 맞는 작업이 없습니다.</p>}

      {filteredItems.length > 0 && range && (
        <section className="gantt-chart" aria-label="프로젝트 간트 차트">
          <div className="gantt-split">
            <div className="gantt-left-panel">
              <header className="gantt-left-header">작업 항목</header>
              <div className="gantt-left-body">
                {filteredItems.map((item, index) => (
                  <article
                    className="gantt-left-row clickable-item"
                    key={`left-${item.id}`}
                    onClick={() => onItemClick(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onItemClick(item);
                      }
                    }}
                    ref={(element) => {
                      leftRowRefs.current[index] = element;
                    }}
                    role="button"
                    style={rowHeights[index] ? { height: `${rowHeights[index]}px` } : undefined}
                    tabIndex={0}
                  >
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-meta">
                      상태: {getStatusLabel(item.status)}
                      {` · ${getTrackLabel(item.track)}`}
                    </p>
                    <p className="timeline-period">
                      목표 기간: {formatDate(getRangeStart(item))} ~ {formatDate(getRangeEnd(item))}
                    </p>
                    {item.description && <p className="timeline-note">{item.description}</p>}
                  </article>
                ))}
              </div>
            </div>

            <div className="gantt-right-panel">
              <div className={`gantt-right-scroll ${isScrollable ? "is-scrollable" : ""}`} ref={scrollContainerRef}>
                <div
                  className="gantt-right-inner"
                  ref={scrollInnerRef}
                  style={{ minWidth: `${Math.max(640, range.totalDays * 44)}px` }}
                >
                  <header className="gantt-right-header">
                    {scaleDates.map((scale, index) => (
                      <span
                        className={`gantt-scale-label ${index === 0 ? "is-start" : ""} ${
                          index === scaleDates.length - 1 ? "is-end" : ""
                        }`}
                        key={scale.offsetDay}
                        style={{ left: `${scale.position}%` }}
                      >
                        {scale.label}
                      </span>
                    ))}
                    {todayPosition !== null && <span className="gantt-today-line" style={{ left: `${todayPosition}%` }} />}
                  </header>

                  <div className="gantt-right-body">
                    {filteredItems.map((item, index) => {
                      const start = toDateValue(getRangeStart(item));
                      const end = toDateValue(getRangeEnd(item));
                      const safeEnd = Math.max(start, end);
                      const startOffsetDays = Math.floor((start - range.min) / DAY_IN_MS);
                      const durationDays = Math.floor((safeEnd - start) / DAY_IN_MS) + 1;
                      const leftPercent = range.totalDays <= 1 ? 0 : (startOffsetDays / range.totalDays) * 100;
                      const widthPercent = Math.max(3, (durationDays / range.totalDays) * 100);
                      const safeWidthPercent = Math.min(widthPercent, Math.max(3, 100 - leftPercent));

                      return (
                        <div
                          className="gantt-right-row clickable-item"
                          key={`right-${item.id}`}
                          onClick={() => onItemClick(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onItemClick(item);
                            }
                          }}
                          ref={(element) => {
                            rightRowRefs.current[index] = element;
                          }}
                          role="button"
                          style={rowHeights[index] ? { height: `${rowHeights[index]}px` } : undefined}
                          tabIndex={0}
                        >
                          {scaleDates.map((scale) => (
                            <span className="gantt-grid-line" key={scale.offsetDay} style={{ left: `${scale.position}%` }} />
                          ))}
                          {todayPosition !== null && (
                            <span className="gantt-today-line" style={{ left: `${todayPosition}%` }} />
                          )}
                          <div
                            className={`gantt-bar status-${item.status}`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${safeWidthPercent}%`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
});
