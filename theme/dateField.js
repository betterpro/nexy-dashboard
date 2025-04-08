import React from "react";

export default function DateField({ title, value, register }) {
  return (
    <div>
      <label className="mb-3 block text-black dark:text-white">{title}</label>
      <div className="relative">
        <input
          type="date"
          {...register(value)}
          className="custom-input-date custom-input-date-2 w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
      </div>
    </div>
  );
}
