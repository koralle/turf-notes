import { Link, useRouter } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { actionLink } from "../lib/action-link";

const box = css({
  color: "muted",
  display: "block",
  fontSize: "13px",
  p: "40px",
  textAlign: "center",
});

const actionButton = css({
  bg: "transparent",
  border: "none",
  color: "accent",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "inherit",
  p: 0,
  textDecoration: "underline",
});

/** 読み込み中の表示。loader が温めていれば出ない（ADR-0006）。 */
export const Loading = () => <output className={box}>読み込み中…</output>;

/** 読み込みに失敗したときの表示。onRetry は失敗した取得をやり直す。 */
export const LoadFailed = ({ onRetry }: { onRetry: () => void }) => (
  <div className={box} role="alert">
    読み込みに失敗しました。{" "}
    <button className={actionButton} onClick={onRetry} type="button">
      もう一度読み込む
    </button>
  </div>
);

/**
 * loader が失敗したときの画面（route の `errorComponent`）。
 * 再試行は loader をやり直す。この時点では画面が組まれていないので、取得だけをやり直せる。
 */
export const ReadError = () => {
  const router = useRouter();

  return <LoadFailed onRetry={() => void router.invalidate()} />;
};

/** メモが無い（削除済み・URL の誤り）ときの表示。 */
export const MissingMemo = () => (
  <div className={box} role="alert">
    メモが見つかりません。{" "}
    <Link className={actionLink} to="/">
      ホームへ戻る
    </Link>
  </div>
);
