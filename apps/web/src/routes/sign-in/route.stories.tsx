import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthMethods } from "@turf-notes/domain";
import { expect, userEvent, within } from "storybook/test";

import { authMethodsQuery } from "../../rpc/queries";
import { Route } from "./route";

/**
 * route の loader と画面の `useQuery` が同じものを見るように、1 つを共有する。
 * キャッシュは story ごとの `methods` で埋め直すので、story をまたいでも漏れない。
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

interface SignInStoryArgs {
  /** `authMethodsQuery` が返す値。画面はこれだけで分岐する。 */
  methods: AuthMethods;
}

const meta = {
  title: "Routes/SignInPage",
  args: {
    // 本番の既定。パスキーが登録済みで、パスワードサインインは無効。
    methods: { hasPasskey: true, passwordSignInEnabled: false },
  },
  parameters: {
    tanstack: {
      router: {
        // loader より前に走るので、ここでキャッシュを埋めておく。
        context: ({
          storyContext,
        }: {
          storyContext: { args: SignInStoryArgs };
        }) => {
          queryClient.setQueryData(
            authMethodsQuery.queryKey,
            storyContext.args.methods
          );
          return { queryClient };
        },
        route: Route,
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<SignInStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** パスキーが既定。パスワード欄は「その他の方法」を開いたときだけ出る。 */
export const Default: Story = {};

/** パスキーが未登録。パスワード欄が最初から出る（区切り線は出ない）。 */
export const NoPasskey: Story = {
  args: { methods: { hasPasskey: false, passwordSignInEnabled: true } },
};

/** パスキーも無く、パスワードサインインも無効。サーバー上の CLI でしか戻せない。 */
export const LockedOut: Story = {
  args: { methods: { hasPasskey: false, passwordSignInEnabled: false } },
};

/**
 * 「その他の方法」でパスワード欄を開いた状態。
 * route の `showPassword` が `aria-expanded` と欄の表示に届いていることまで確かめる。
 */
export const PasswordExpanded: Story = {
  args: { methods: { hasPasskey: true, passwordSignInEnabled: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      name: "その他の方法でログインする",
    });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByLabelText("メールアドレス")).toBeNull();

    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByLabelText("メールアドレス")).toBeInTheDocument();
  },
};
