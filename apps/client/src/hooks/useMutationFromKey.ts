import { MutationState, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useMutationFromKey = ({
  mutationKey,
}: {
  mutationKey: string;
}) => {
  const queryClient = useQueryClient();
  const [mutateState, setMutateState] =
    useState<MutationState<unknown, unknown, unknown, unknown>>();

  useEffect(() => {
    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(({ type, mutation }) => {
        if (
          type === 'updated' &&
          mutation.options.mutationKey?.[0] === mutationKey
        ) {
          setMutateState(mutation?.state);
        }
      });

    return unsubscribe;
  }, [mutationKey, queryClient]);

  return { mutateState };
};
