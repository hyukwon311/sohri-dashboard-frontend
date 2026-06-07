import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryProvider } from "./app/providers/QueryProvider";
import { App } from "./app/App.tsx";
import "./app/styles/tokens.css";
import "./app/styles/global.css";

async function enableMocking() {
  const isMockEnabled = import.meta.env.VITE_ENABLE_MSW !== "false";
  if (!isMockEnabled) {
    return;
  }

  try {
    const { worker } = await import("./app/mocks/browser");
    void worker.start({
      onUnhandledRequest: "bypass",
    });
  } catch (error) {
    console.warn("MSW initialization failed. Continuing without mocks.", error);
  }
}

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Cannot find #app element");
}

void enableMocking();

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
);
