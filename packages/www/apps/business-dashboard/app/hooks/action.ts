import { type FetcherWithComponents, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isActionError } from "~/utils/response.js";

export function useActionErrorToast(actionData: unknown) {
  useEffect(() => {
    if (isActionError(actionData)) {
      toast.error(actionData.error.message, {
        position: "bottom-right",
        duration: 5000,
      });
    }
  }, [actionData]);
}

export type FetcherWithComponentsReset<T extends (...args: any) => any> = Omit<
  FetcherWithComponents<Awaited<ReturnType<T>>>,
  "data"
> & {
  data: Awaited<ReturnType<T>> | undefined;
  reset: () => void;
};

export function useFetcherWithReset<T extends (...args: any) => any>(opts?: {
  key: string;
}): FetcherWithComponentsReset<T> {
  const fetcher = useFetcher<Awaited<ReturnType<T>>>(opts);
  const [data, setData] = useState<Awaited<ReturnType<T>> | undefined>(
    fetcher.data,
  );

  useEffect(() => {
    if (fetcher.state === "idle") {
      setData(fetcher.data);
    }
    if (fetcher.state === "submitting") {
      setData(undefined);
    }
  }, [fetcher.state, fetcher.data]);

  return {
    ...fetcher,
    data,
    reset: () => setData(undefined),
  };
}
