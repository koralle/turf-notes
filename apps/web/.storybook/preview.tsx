import type { Preview } from "@storybook/tanstack-react";
import { QueryClientProvider } from "@tanstack/react-query";

import "../src/index.css";
import "../src/routeTree.gen";
import { resetHandlers, startWorker } from "../src/mocks/browser";
import { createAppQueryClient } from "../src/rpc/query-client";

const queryClient = createAppQueryClient();

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  loaders: [
    async () => {
      await startWorker();
      resetHandlers();
      queryClient.clear();

      return {};
    },
  ],
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        context: { queryClient },
      },
    },
  },
};

export default preview;
