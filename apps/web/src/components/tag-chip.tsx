import type { TagSummary } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

const chip = css({
  alignItems: "center",
  bg: "chip",
  borderRadius: "999px",
  color: "chipInk",
  display: "inline-flex",
  fontSize: "11px",
  gap: "5px",
  px: "8px",
  py: "2px",
});

const dot = css({ borderRadius: "999px", flex: "0 0 5px", h: "5px", w: "5px" });

const dotOf = {
  horse: css({ bg: "horse" }),
  person: css({ bg: "person" }),
  theme: css({ bg: "theme" }),
} as const;

export const TagChip = ({
  tag,
  onRemove,
}: {
  tag: TagSummary;
  onRemove?: () => void;
}) => (
  <span className={chip}>
    <span className={`${dot} ${dotOf[tag.kind]}`} />
    {tag.name}
    {onRemove === undefined ? null : (
      <button
        aria-label={`${tag.name} を外す`}
        className={css({
          color: "faint",
          cursor: "pointer",
          fontSize: "10px",
          ml: "1px",
        })}
        onClick={onRemove}
        type="button"
      >
        ×
      </button>
    )}
  </span>
);
