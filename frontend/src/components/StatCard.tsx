interface StatCardProps {
  title: string;
  value: string;
}

export function StatCard({ title, value }: StatCardProps): JSX.Element {
  return (
    <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-sky-300">{value}</p>
    </article>
  );
}
