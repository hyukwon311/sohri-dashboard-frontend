import { useQuery } from "@tanstack/react-query";
import { getDashboardSnapshot } from "../api/progressApi";

export function useDashboardSnapshotQuery() {
  return useQuery({
    queryKey: ["dashboard", "snapshot"],
    queryFn: getDashboardSnapshot,
    refetchInterval: 60_000,
  });
}

export function useDashboardData() {
  const snapshotQuery = useDashboardSnapshotQuery();

  const refresh = async () => {
    await snapshotQuery.refetch();
  };

  return {
    data: snapshotQuery.data,
    refresh,
    isLoading: snapshotQuery.isLoading,
    isFetching: snapshotQuery.isFetching,
    isError: snapshotQuery.isError,
  };
}
