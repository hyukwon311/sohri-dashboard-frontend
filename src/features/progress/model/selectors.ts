import type { WorkItem } from "./types";

interface MergeBoardItemsParams {
  sourceItems: WorkItem[];
  createdItems: WorkItem[];
  editedItems: Record<string, WorkItem>;
  deletedItemSet: Set<string>;
  track: WorkItem["track"];
}

export function mergeBoardItems({
  sourceItems,
  createdItems,
  editedItems,
  deletedItemSet,
  track,
}: MergeBoardItemsParams) {
  const applyOverlay = (item: WorkItem) => editedItems[item.id] ?? item;

  return [
    ...sourceItems.filter((item) => !deletedItemSet.has(item.id)).map(applyOverlay),
    ...createdItems.filter((item) => item.track === track && !deletedItemSet.has(item.id)).map(applyOverlay),
  ];
}
