// Simple progress bar component to show practice progress.
// Props:
// - current: number (current phrase index, starting at 1)
// - total: number (total number of phrases)

import React from "react";

export default function ProgressBar({ current, total }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full mb-4">
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-3 bg-green-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-center text-sm text-gray-600 mt-1">
        {current} / {total}
      </p>
    </div>
  );
}
