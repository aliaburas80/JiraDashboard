import React from "react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  code?: number;
}

export default function ErrorState({ message, onRetry, code }: ErrorStateProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-10.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {code !== undefined ? (
            <span className="mr-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
              {code}
            </span>
          ) : null}
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 active:bg-red-800 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
