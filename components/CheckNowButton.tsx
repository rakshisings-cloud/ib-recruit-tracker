"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckNowButton({ firmId }: { firmId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "queued" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch(`/api/check-now/${firmId}`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setState(data.queued ? "queued" : "idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <button className="btn" onClick={handleClick} disabled={state === "loading"}>
      {state === "loading" && "Checking..."}
      {state === "queued" && "Queued — refresh shortly"}
      {state === "error" && "Failed — retry"}
      {state === "idle" && "Check Now"}
    </button>
  );
}
