import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrackType, WorkItem, WorkStatus } from "../features/progress/model/types";
import { useDashboardData } from "../features/progress/model/queries";
import { mergeBoardItems } from "../features/progress/model/selectors";
import { formatDate, getStatusLabel, getTrackLabel } from "../features/progress/model/formatters";
import { KanbanBoard, type BoardTab } from "../features/progress/ui/KanbanBoard";
import { TimelinePanel } from "../features/progress/ui/TimelinePanel";

type CreateTrackSelection = TrackType;

interface CreateWorkItemForm {
  track: CreateTrackSelection;
  title: string;
  description: string;
  owner: string;
  status: WorkItem["status"];
  startDate: string;
  dueDate: string;
}

const initialForm: CreateWorkItemForm = {
  track: "planning",
  title: "",
  description: "",
  owner: "",
  status: "todo",
  startDate: "",
  dueDate: "",
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function itemToForm(item: WorkItem): CreateWorkItemForm {
  return {
    track: item.track,
    title: item.title,
    description: item.description ?? "",
    owner: item.owner ?? "",
    status: item.status,
    startDate: item.startDate ?? "",
    dueDate: item.dueDate ?? "",
  };
}

export function DashboardPage() {
  const { data, refresh, isLoading, isError } = useDashboardData();
  const [activeTimelineTab, setActiveTimelineTab] = useState<BoardTab>("all");
  const [activeKanbanTab, setActiveKanbanTab] = useState<BoardTab>("all");
  const [createdItems, setCreatedItems] = useState<WorkItem[]>([]);
  const [editedItems, setEditedItems] = useState<Record<string, WorkItem>>({});
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWorkItemForm>(initialForm);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [detailForm, setDetailForm] = useState<CreateWorkItemForm>(initialForm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isDeleteConfirmOpen) {
        setIsDeleteConfirmOpen(false);
        return;
      }

      if (selectedItem) {
        setSelectedItem(null);
        setIsDetailEditMode(false);
        return;
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCreateModalOpen, isDeleteConfirmOpen, selectedItem]);

  const deletedItemSet = useMemo(() => new Set(deletedItemIds), [deletedItemIds]);
  const planningSourceItems = data?.board?.planning ?? [];
  const generatorSourceItems = data?.board?.generator ?? [];
  const orchestratorSourceItems = data?.board?.orchestrator ?? [];
  const engineSourceItems = data?.board?.engine ?? [];

  const planningItems = useMemo(() => {
    return mergeBoardItems({
      sourceItems: planningSourceItems,
      createdItems,
      editedItems,
      deletedItemSet,
      track: "planning",
    });
  }, [createdItems, deletedItemSet, editedItems, planningSourceItems]);

  const generatorItems = useMemo(() => {
    return mergeBoardItems({
      sourceItems: generatorSourceItems,
      createdItems,
      editedItems,
      deletedItemSet,
      track: "generator",
    });
  }, [createdItems, deletedItemSet, editedItems, generatorSourceItems]);

  const orchestratorItems = useMemo(() => {
    return mergeBoardItems({
      sourceItems: orchestratorSourceItems,
      createdItems,
      editedItems,
      deletedItemSet,
      track: "orchestrator",
    });
  }, [createdItems, deletedItemSet, editedItems, orchestratorSourceItems]);

  const engineItems = useMemo(() => {
    return mergeBoardItems({
      sourceItems: engineSourceItems,
      createdItems,
      editedItems,
      deletedItemSet,
      track: "engine",
    });
  }, [createdItems, deletedItemSet, editedItems, engineSourceItems]);

  const sharedItems = useMemo(
    () => [...planningItems, ...generatorItems, ...orchestratorItems, ...engineItems],
    [planningItems, generatorItems, orchestratorItems, engineItems],
  );

  const openItemDetail = useCallback(
    (item: WorkItem) => {
      const resolvedItem = editedItems[item.id] ?? item;
      setSelectedItem(resolvedItem);
      setDetailForm(itemToForm(resolvedItem));
      setIsDetailEditMode(false);
    },
    [editedItems],
  );

  const handleChangeItemStatus = useCallback(
    (item: WorkItem, nextStatus: WorkStatus) => {
      const resolvedItem = editedItems[item.id] ?? item;
      if (resolvedItem.status === nextStatus) {
        return;
      }

      const updatedItem: WorkItem = {
        ...resolvedItem,
        status: nextStatus,
        updatedAt: getTodayDate(),
      };

      setEditedItems((prev) => ({
        ...prev,
        [item.id]: updatedItem,
      }));

      if (selectedItem?.id === item.id) {
        setSelectedItem(updatedItem);
        setDetailForm((prev) => ({
          ...prev,
          status: nextStatus,
        }));
      }
    },
    [editedItems, selectedItem?.id],
  );

  if (isLoading) {
    return (
      <main className="dashboard-page">
        <section className="panel">
          <h1 className="page-title">Sohri 프로젝트 진행상황</h1>
          <p className="page-subtitle">데이터를 불러오는 중입니다.</p>
        </section>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="dashboard-page">
        <section className="panel">
          <h1 className="page-title">Sohri 프로젝트 진행상황</h1>
          <p className="page-subtitle">데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          <button className="refresh-button" onClick={() => void refresh()} type="button">
            다시 시도
          </button>
        </section>
      </main>
    );
  }

  const handleCreateItem = () => {
    const trimmedTitle = createForm.title.trim();
    if (!trimmedTitle) {
      return;
    }

    const newItem: WorkItem = {
      id: `local-${Date.now()}`,
      track: createForm.track,
      title: trimmedTitle,
      description: createForm.description.trim() || undefined,
      owner: createForm.owner.trim() || undefined,
      status: createForm.status,
      startDate: createForm.startDate || undefined,
      dueDate: createForm.dueDate || undefined,
      updatedAt: getTodayDate(),
    };

    setCreatedItems((prev) => [...prev, newItem]);
    setCreateForm(initialForm);
    setIsCreateModalOpen(false);
  };

  const handleUpdateSelectedItem = () => {
    if (!selectedItem) {
      return;
    }

    const trimmedTitle = detailForm.title.trim();
    if (!trimmedTitle) {
      return;
    }

    const updatedItem: WorkItem = {
      ...selectedItem,
      track: detailForm.track,
      title: trimmedTitle,
      description: detailForm.description.trim() || undefined,
      owner: detailForm.owner.trim() || undefined,
      status: detailForm.status,
      startDate: detailForm.startDate || undefined,
      dueDate: detailForm.dueDate || undefined,
      updatedAt: getTodayDate(),
    };

    setEditedItems((prev) => ({
      ...prev,
      [selectedItem.id]: updatedItem,
    }));
    setSelectedItem(updatedItem);
    setIsDetailEditMode(false);
  };

  const handleDeleteSelectedItem = () => {
    if (!selectedItem) {
      return;
    }

    const targetId = selectedItem.id;
    setCreatedItems((prev) => prev.filter((item) => item.id !== targetId));
    setEditedItems((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    setDeletedItemIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    setSelectedItem(null);
    setIsDetailEditMode(false);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-title-row">
        <h1 className="page-title">Sohri Project Progress</h1>
        <button className="create-button" onClick={() => setIsCreateModalOpen(true)} type="button">
          작업 생성
        </button>
      </header>

      <section className="dashboard-main-stack">
        <TimelinePanel
          activeTab={activeTimelineTab}
          items={sharedItems}
          onItemClick={openItemDetail}
          onTabChange={setActiveTimelineTab}
        />
        <KanbanBoard
          activeTab={activeKanbanTab}
          itemsByTrack={{
            planning: planningItems,
            generator: generatorItems,
            orchestrator: orchestratorItems,
            engine: engineItems,
          }}
          onItemClick={openItemDetail}
          onItemStatusChange={handleChangeItemStatus}
          onTabChange={setActiveKanbanTab}
        />
      </section>

      {isCreateModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setIsCreateModalOpen(false)}>
          <section className="modal-card" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h2 className="section-title">새 작업 생성</h2>
            </header>

            <div className="modal-grid">
              <label className="field-label">
                트랙
                <select
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      track: event.target.value as CreateTrackSelection,
                    }))
                  }
                  value={createForm.track}
                >
                  <option value="planning">기획</option>
                  <option value="generator">Generator</option>
                  <option value="orchestrator">Orchestrator</option>
                  <option value="engine">Engine</option>
                </select>
              </label>

              <label className="field-label field-span-2">
                작업명
                <input
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="작업 이름을 입력해 주세요."
                  type="text"
                  value={createForm.title}
                />
              </label>

              <label className="field-label field-span-2">
                설명
                <textarea
                  className="field-input field-textarea"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="작업 설명을 입력해 주세요."
                  value={createForm.description}
                />
              </label>

              <label className="field-label">
                상태
                <select
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: event.target.value as WorkItem["status"],
                    }))
                  }
                  value={createForm.status}
                >
                  <option value="todo">대기</option>
                  <option value="in_progress">진행중</option>
                  <option value="done">완료</option>
                </select>
              </label>

              <label className="field-label">
                담당자
                <input
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      owner: event.target.value,
                    }))
                  }
                  placeholder="예: 기획팀"
                  type="text"
                  value={createForm.owner}
                />
              </label>

              <label className="field-label">
                시작일
                <input
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={createForm.startDate}
                />
              </label>

              <label className="field-label">
                종료일
                <input
                  className="field-input"
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={createForm.dueDate}
                />
              </label>
            </div>

            <footer className="modal-actions">
              <button className="ghost-button" onClick={() => setIsCreateModalOpen(false)} type="button">
                취소
              </button>
              <button className="create-button" onClick={handleCreateItem} type="button">
                생성
              </button>
            </footer>
          </section>
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedItem(null)}>
          <section className="modal-card" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h2 className="section-title">작업 상세보기</h2>
            </header>

            {!isDetailEditMode && (
              <div className="detail-grid">
                <div className="detail-item field-span-2">
                  <p className="detail-label">작업명</p>
                  <p className="detail-value">{selectedItem.title}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">상태</p>
                  <p className="detail-value">{getStatusLabel(selectedItem.status)}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">트랙</p>
                  <p className="detail-value">{getTrackLabel(selectedItem.track)}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">담당자</p>
                  <p className="detail-value">{selectedItem.owner ?? "-"}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">기간</p>
                  <p className="detail-value">
                    {formatDate(selectedItem.startDate ?? selectedItem.updatedAt)} ~{" "}
                    {formatDate(selectedItem.dueDate ?? selectedItem.updatedAt)}
                  </p>
                </div>
                <div className="detail-item field-span-2">
                  <p className="detail-label">설명</p>
                  <p className="detail-value">{selectedItem.description ?? "설명이 없습니다."}</p>
                </div>
              </div>
            )}

            {isDetailEditMode && (
              <div className="modal-grid">
                <label className="field-label">
                  트랙
                  <select
                    className="field-input"
                    onChange={(event) =>
                      setDetailForm((prev) => ({
                        ...prev,
                        track: event.target.value as CreateTrackSelection,
                      }))
                    }
                    value={detailForm.track}
                  >
                    <option value="planning">기획</option>
                    <option value="generator">Generator</option>
                    <option value="orchestrator">Orchestrator</option>
                    <option value="engine">Engine</option>
                  </select>
                </label>
                <label className="field-label field-span-2">
                  작업명
                  <input
                    className="field-input"
                    onChange={(event) => setDetailForm((prev) => ({ ...prev, title: event.target.value }))}
                    type="text"
                    value={detailForm.title}
                  />
                </label>
                <label className="field-label field-span-2">
                  설명
                  <textarea
                    className="field-input field-textarea"
                    onChange={(event) => setDetailForm((prev) => ({ ...prev, description: event.target.value }))}
                    value={detailForm.description}
                  />
                </label>
                <label className="field-label">
                  상태
                  <select
                    className="field-input"
                    onChange={(event) =>
                      setDetailForm((prev) => ({ ...prev, status: event.target.value as WorkItem["status"] }))
                    }
                    value={detailForm.status}
                  >
                    <option value="todo">대기</option>
                    <option value="in_progress">진행중</option>
                    <option value="done">완료</option>
                  </select>
                </label>
                <label className="field-label">
                  담당자
                  <input
                    className="field-input"
                    onChange={(event) => setDetailForm((prev) => ({ ...prev, owner: event.target.value }))}
                    type="text"
                    value={detailForm.owner}
                  />
                </label>
                <label className="field-label">
                  시작일
                  <input
                    className="field-input"
                    onChange={(event) => setDetailForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    type="date"
                    value={detailForm.startDate}
                  />
                </label>
                <label className="field-label">
                  종료일
                  <input
                    className="field-input"
                    onChange={(event) => setDetailForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                    type="date"
                    value={detailForm.dueDate}
                  />
                </label>
              </div>
            )}

            <footer className="modal-actions">
              {!isDetailEditMode && (
                <>
                  <button
                    className="create-button"
                    onClick={() => {
                      setDetailForm(itemToForm(selectedItem));
                      setIsDetailEditMode(true);
                    }}
                    type="button"
                  >
                    수정
                  </button>
                  <button className="danger-button" onClick={() => setIsDeleteConfirmOpen(true)} type="button">
                    삭제
                  </button>
                  <button className="ghost-button" onClick={() => setSelectedItem(null)} type="button">
                    닫기
                  </button>
                </>
              )}
              {isDetailEditMode && (
                <>
                  <button className="ghost-button" onClick={() => setIsDetailEditMode(false)} type="button">
                    취소
                  </button>
                  <button className="create-button" onClick={handleUpdateSelectedItem} type="button">
                    저장
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}

      {isDeleteConfirmOpen && selectedItem && (
        <div className="modal-overlay" role="presentation" onClick={() => setIsDeleteConfirmOpen(false)}>
          <section className="confirm-card" onClick={(event) => event.stopPropagation()}>
            <h3 className="section-title">작업 삭제 확인</h3>
            <p className="page-subtitle">
              <strong>{selectedItem.title}</strong> 항목을 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setIsDeleteConfirmOpen(false)} type="button">
                취소
              </button>
              <button className="danger-button" onClick={handleDeleteSelectedItem} type="button">
                삭제
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
