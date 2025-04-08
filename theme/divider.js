import React from "react";

export default function Divider({ title }) {
  return (
    <div class="flex items-center col-span-2">
      <span class="px-4 text-gray-600 text-lg font-semibold dark:text-gray-400">
        {title}
      </span>
      <span class="flex-grow bg-gray-300 border h-px dark:bg-gray-700"></span>
    </div>
  );
}
