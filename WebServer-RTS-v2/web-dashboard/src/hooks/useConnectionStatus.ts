import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";

export type ConnectionStatus = {
  connected: boolean;
  lastChangeMs?: number;
};

export function useConnectionStatus(): ConnectionStatus {
  const [connected, setConnected] = useState(false);
  const [lastChangeMs, setLastChangeMs] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!db) return;
    const statusRef = ref(db, ".info/connected");
    const unsubscribe = onValue(statusRef, (snap) => {
      setConnected(!!snap.val());
      setLastChangeMs(Date.now());
    });
    return () => unsubscribe();
  }, []);

  return { connected, lastChangeMs };
}
