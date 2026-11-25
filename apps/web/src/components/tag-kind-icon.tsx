import type { TagKind } from "@turf-notes/domain";
import { ChessKnight, Hash, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { css } from "styled-system/css";

import { kindLabels, tagColorOf } from "../lib/tag-kind";

const iconByKind: Record<TagKind, LucideIcon> = {
  horse: ChessKnight,
  person: User,
  theme: Hash,
};

const iconStyle = css({ flexShrink: 0 });

/** タグの種類（馬・人・主題）をアイコンと色で示す。 */
export const TagKindIcon = ({ kind }: { kind: TagKind }) => {
  const Icon = iconByKind[kind];

  return (
    <>
      <Icon
        aria-hidden="true"
        className={`${iconStyle} ${tagColorOf[kind]}`}
        size={14}
      />
      <span className="visually-hidden">{`${kindLabels[kind]} `}</span>
    </>
  );
};
