import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** 作成日時・更新日時の既定値。ミリ秒精度の Unix 時刻で持つ。 */
export const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(nowMs),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  ...timestamps,
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ...timestamps,
});

export const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
};

/** タグの種類。馬・人（騎手／調教師）・主題の3種。 */
export const tagKinds = ["horse", "person", "theme"] as const;
export type TagKind = (typeof tagKinds)[number];

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: tagKinds }).notNull(),
    /** ユーザーが見て編集する書き形（名前の正本）。 */
    name: text("name").notNull(),
    /** `name` から常に導出される正規化形。一意性の判定に使う。 */
    normalizedName: text("normalized_name").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tags_user_normalized").on(table.userId, table.normalizedName),
  ]
);

/**
 * Memo が指すレース。独立したテーブルを持たず、
 * 開催日・競馬場・レース番号の3つ組で同定する（ADR-0001）。
 */
export const memos = sqliteTable("memos", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** 任意の表題。未入力なら本文の1行目を見出しに使う。 */
  title: text("title"),
  body: text("body").notNull(),
  /** 開催日（YYYY-MM-DD）。レース情報は3項目そろって初めて意味を持つ。 */
  raceDate: text("race_date"),
  venue: text("venue"),
  raceNumber: integer("race_number"),
  /** 任意の表示名。平場では条件を書く。同定には使わない。 */
  raceName: text("race_name"),
  ...timestamps,
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const memoTags = sqliteTable(
  "memo_tags",
  {
    memoId: text("memo_id")
      .notNull()
      .references(() => memos.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("memo_tags_memo_tag").on(table.memoId, table.tagId)]
);

/** メモからメモへの参照。保存は方向つき、表示は両方向。 */
export const memoLinks = sqliteTable(
  "memo_links",
  {
    fromMemoId: text("from_memo_id")
      .notNull()
      .references(() => memos.id, { onDelete: "cascade" }),
    toMemoId: text("to_memo_id")
      .notNull()
      .references(() => memos.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(nowMs),
  },
  (table) => [
    uniqueIndex("memo_links_pair").on(table.fromMemoId, table.toMemoId),
  ]
);
