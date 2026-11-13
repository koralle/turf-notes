import * as v from "valibot";

export const signInFormSchema = v.pipe(
  v.object({
    email: v.pipe(
      v.string(),
      v.trim(),
      v.email("メールアドレスの形式が違います。")
    ),
    password: v.pipe(
      v.string(),
      v.minLength(1, "パスワードを入力してください。"),
      v.maxLength(128)
    ),
  }),
  v.brand("SignInFormSchema")
);

export type SignInFormSchema = v.InferOutput<typeof signInFormSchema>;
