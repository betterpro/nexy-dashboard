import React from "react";

export default function NumberField({ title, defaultValue, value, register }) {
  return (
    <div>
      <label className="mb-3 block text-black dark:text-white">{title}</label>
      <input
        type="number"
        defaultValue={defaultValue}
        placeholder={title}
        {...register(value, { valueAsNumber: true })}
        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      />
    </div>
  );
}
