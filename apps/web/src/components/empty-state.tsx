import { css } from "styled-system/css";

/** 一覧が空のときの表示。ホーム・タグ・レースで共有する。 */
export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div
    className={css({
      color: "muted",
      fontSize: "13px",
      py: "40px",
      textAlign: "center",
    })}
  >
    {children}
  </div>
);
