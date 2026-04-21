interface ProgressBarProps {
  earned: number;
  total: number;
}

export function ProgressBar({ earned, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Badges Collected:{" "}
          <span className="text-primary">
            {earned} / {total}
          </span>
        </p>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
