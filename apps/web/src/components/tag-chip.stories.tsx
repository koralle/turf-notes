import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagChip } from "./tag-chip";

const meta = {
  component: TagChip,
  title: "Components/TagChip",
} satisfies Meta<typeof TagChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horse: Story = {
  args: { tag: { id: 1, kind: "horse", name: "ソダシ" } },
};

export const Person: Story = {
  args: { tag: { id: 2, kind: "person", name: "武豊" } },
};

export const Theme: Story = {
  args: { tag: { id: 3, kind: "theme", name: "展開" } },
};

export const Removable: Story = {
  args: { onRemove: () => {}, tag: { id: 1, kind: "horse", name: "ソダシ" } },
};
