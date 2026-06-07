import { setupWorker } from "msw/browser";
import { handlers } from "../../features/progress/mock/handlers";

export const worker = setupWorker(...handlers);
