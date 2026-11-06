import MarkdownIt from "markdown-it";
import { useMemo } from "react";
import { css } from "styled-system/css";

/** 生の HTML は通さない（`html: false`）。リンクは自動リンクのみ。 */
const md = new MarkdownIt({ breaks: true, html: false, linkify: true });
// markdown-it 15 の linkify-it 6 は素のドメインをリンクにしない。14 までの挙動に戻す。
md.linkify.set({ fuzzyLink: true });

export const Markdown = ({ source }: { source: string }) => {
  const html = useMemo(() => md.render(source), [source]);

  return (
    <div
      className={`markdown ${css({ fontSize: "14.5px", lineHeight: 2 })}`}
      // markdown-it は html:false で生 HTML をエスケープするため、出力は安全
      // oxlint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
