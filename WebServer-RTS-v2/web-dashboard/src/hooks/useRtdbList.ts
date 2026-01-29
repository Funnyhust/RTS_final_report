import { useEffect, useMemo, useState } from "react";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import type { Query } from "firebase/database";
import { db } from "../firebase";

export type RtdbListItem<T> = T & { id: string };

export type RtdbListOptions<T> = {
  sort?: (a: RtdbListItem<T>, b: RtdbListItem<T>) => number;
  orderByChild?: string;
  limitToLast?: number;
};

export function useRtdbList<T extends Record<string, unknown>>(
  path: string | null,
  options: RtdbListOptions<T> = {}
) {
  const [value, setValue] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!path || !db) {
      setValue({});
      setLoading(false);
      return;
    }

    setLoading(true);
    let q: Query = ref(db, path);
    if (options.orderByChild) {
      q = query(q, orderByChild(options.orderByChild));
    }
    if (typeof options.limitToLast === "number") {
      q = query(q, limitToLast(options.limitToLast));
    }

    const unsubscribe = onValue(
      q,
      (snap) => {
        setValue((snap.val() ?? {}) as Record<string, T>);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, options.orderByChild, options.limitToLast]);

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
