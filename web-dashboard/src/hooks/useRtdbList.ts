import { useMemo } from "react";
import { useRtdbValue } from "./useRtdbValue";

export type RtdbListItem<T> = T & { id: string };

export type RtdbListOptions<T> = {
  sort?: (a: RtdbListItem<T>, b: RtdbListItem<T>) => number;
};

export function useRtdbList<T extends Record<string, unknown>>(
  path: string | null,
  options: RtdbListOptions<T> = {}
) {
  const { value, loading, error } = useRtdbValue<Record<string, T>>(path, {});
  const list = useMemo(() => {
    const entries = Object.entries(value ?? {});
    const items = entries.map(([id, item]) => ({ id, ...(item as T) }));
    if (options.sort) {
      items.sort(options.sort);
    }
    return items;
  }, [value, options.sort]);

  return { list, loading, error };
}
