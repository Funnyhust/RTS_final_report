import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";

export type RtdbValueResult<T> = {
  value: T;
  loading: boolean;
  error: unknown;
};

export function useRtdbValue<T>(path: string | null, initial: T): RtdbValueResult<T> {
  const [value, setValue] = useState<T>(initial);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!path || !db) {
      setLoading(false);
      return;
    }

    const dataRef = ref(db, path);
    const unsubscribe = onValue(
      dataRef,
      (snap) => {
        setValue((snap.val() ?? initial) as T);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { value, loading, error };
}
