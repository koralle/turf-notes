import "./index.css";
import "vitest-browser-react";
import { afterEach, beforeAll } from "vitest";

import { resetHandlers, startWorker } from "./mocks/browser";

beforeAll(async () => {
  await startWorker();
});

afterEach(() => {
  resetHandlers();
});
