import { useEffect, useState } from "react";
import { healthCheck } from "@/services/api";

export function DashboardPage(): JSX.Element {
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    healthCheck()
      .then((result) => setHealth(result.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold">Backend Health</h2>
      <p className="mt-2 text-slate-300">REST API status: {health}</p>
    </section>
  );
}
