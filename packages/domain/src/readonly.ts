import type { ReadonlyDeep } from "type-fest";
import * as v from "valibot";
import type { GenericSchema, InferOutput } from "valibot";

/**
 * パース結果を入れ子まで型レベルで readonly にする。
 * readonly は型にしか現れないため、実行時には値をそのまま返す（凍結しない）。
 */
export const readonlyValue = <TSchema extends GenericSchema>(schema: TSchema) =>
  v.pipe(
    schema,
    v.transform(
      (value): ReadonlyDeep<InferOutput<TSchema>> =>
        // SAFETY: readonly は型にしか現れない。実行時の値は入力と同一で、
        // valibot の検証では示せないので、ここだけ型を重ねる。
        value as ReadonlyDeep<InferOutput<TSchema>>
    )
  );
