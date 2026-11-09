import { useEffect, useState } from "react";

/**
 * 入力が止まってから 250ms 後に値が変わる。1文字ごとに API を叩かないために使う。
 * 表示は入力値をそのまま使い、取得だけこの値で行う。空文字は待たずに返す
 * （クリアしたのに古い結果が残らないように）。
 */
export const useDebouncedValue = (value: string): string => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  return value === "" ? value : debounced;
};
