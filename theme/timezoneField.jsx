import React from 'react';
import { timeZones } from '@/utils/timezone';

const TimezoneField = ({ register, title, value }) => {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </label>
      <select
        {...register(value, { 
          required: true,
          validate: value => value !== null && value !== undefined && value !== ''
        })}
        defaultValue="America/Vancouver"
        className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      >
        {timeZones.map((timezone) => (
          <option key={timezone.value} value={timezone.value}>
            {timezone.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneField; 