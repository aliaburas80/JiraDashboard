"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 rounded-full p-2">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-700">
            Something went wrong
          </h2>
        </div>

        <p className="text-red-600 text-sm bg-red-100 rounded-lg px-4 py-3 mb-6 break-words">
          {error.message || "An unexpected error occurred."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 btn-danger py-2 px-4"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 btn-outline-danger py-2 px-4"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
