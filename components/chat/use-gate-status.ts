"use client";

import { useEffect, useState } from "react";

type Peer = { governanceStatus?: string };

/**
 * The gate is always on. Federation peers are optional.
 * Chat models come from /api/models — never from the peer list.
 */
export function useGateStatus() {
  const [modelCount, setModelCount] = useState(0);
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    fetch(`${base}/api/models`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: unknown) => {
        setModelCount(
          data && typeof data === "object" ? Object.keys(data).length : 0
        );
      })
      .catch(() => setModelCount(0));

    fetch(`${base}/api/federation/register`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        setPeers(Array.isArray(data) ? (data as Peer[]) : []);
      })
      .catch(() => setPeers([]));
  }, []);

  const peerCount = peers.length;
  const allSovereign =
    peerCount > 0 && peers.every((peer) => peer.governanceStatus === "SOVEREIGN");

  return { modelCount, peerCount, allSovereign };
}
