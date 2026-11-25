import { tags, users } from "@turf-notes/db/schema";
import { userId } from "@turf-notes/domain";
import { beforeEach, describe, expect, test } from "vitest";

import { resetTestDb, testDb } from "../../test-db";
import { createTag } from "./queries";

const owner = userId("user-owner");

beforeEach(async () => {
  await resetTestDb();
  await testDb
    .insert(users)
    .values({ email: "owner@example.com", id: owner, name: "Owner" });
});

describe("createTag", () => {
  test("同じ名前のタグは増やさず、既存を返す", async () => {
    const first = await createTag(testDb, owner, "ソダシ", "horse");
    const second = await createTag(testDb, owner, "ソダシ", "horse");

    expect(second.id).toBe(first.id);
    await expect(testDb.select().from(tags)).resolves.toHaveLength(1);
  });
});
