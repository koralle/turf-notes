import { useMutation } from "@tanstack/react-query";

interface UseSignInProps<TVariables, TResult> {
  onSignIn: (variables: TVariables) => Promise<TResult>;
  onSuccess: (result: TResult) => Promise<void>;
}

export const useSignIn = <TVariables = void, TResult = void>({
  onSignIn,
  onSuccess,
}: UseSignInProps<TVariables, TResult>) => {
  const mutation = useMutation({
    mutationFn: onSignIn,
    onSuccess,
  });

  return {
    error: mutation.error?.message ?? null,
    isPending: mutation.isPending,
    signIn: mutation.mutate,
  };
};
