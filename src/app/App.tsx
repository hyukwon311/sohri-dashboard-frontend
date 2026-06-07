import { Suspense, lazy } from "react";

const DashboardPage = lazy(async () => {
  const module = await import("../pages/DashboardPage");
  return { default: module.DashboardPage };
});

export function App() {
  return (
    <Suspense
      fallback={
        <main className="dashboard-page">
          <section className="panel">
            <h1 className="page-title">Sohri 프로젝트 진행상황</h1>
            <p className="page-subtitle">화면을 불러오는 중입니다.</p>
          </section>
        </main>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
