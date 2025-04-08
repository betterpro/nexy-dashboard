"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useForm } from "react-hook-form";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import TextField from "@/theme/textField";
import Divider from "@/theme/divider";
import NumberField from "@/theme/numberField";
import TextAreaField from "@/theme/textareaField";
import DateField from "@/theme/dateField";
import { DB } from "@/firebase";
import { formList } from "@/app/stations/formList";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import Link from "next/link";
import StationMedia from "./StationMedia";
import { useAuth } from "@/components/context/AuthContext";

function EditStation({ params }) {
  const { user, userRole } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isDirty, isSubmitting },
  } = useForm();

  const fetchData = async () => {
    try {
      const dataRef = await getDoc(doc(DB, "stations", params.stationId));
      if (dataRef.exists()) {
        const data = dataRef.data();

        // Check if user has permission to edit this station
        if (
          userRole === ROLES.FRANCHISEE &&
          data.franchiseeId !== user.franchiseeId
        ) {
          toast.error("You don't have permission to edit this station");
          return;
        }

        Object.entries(data).forEach(([key, value]) => {
          if (key === "slots" || key === "powerBank") {
            setValue(key, Number(value));
          } else {
            setValue(key, value || "");
          }
        });
      }
    } catch (error) {
      console.error("Error fetching station data:", error);
      toast.error("Failed to fetch station data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.stationId, userRole, user?.uid]);

  const onSubmit = async (data) => {
    try {
      // Check if user has permission to edit this station
      const stationRef = doc(DB, "stations", params.stationId);
      const stationDoc = await getDoc(stationRef);
      const stationData = stationDoc.data();

      if (
        userRole === ROLES.FRANCHISEE &&
        stationData.franchiseeId !== user.franchiseeId
      ) {
        toast.error("You don't have permission to edit this station");
        return;
      }

      await setDoc(
        stationRef,
        {
          ...data,
          powerBank: Number(data.powerBank),
          slots: Number(data.slots),
          parking: Number(data.slots - data.powerBank),
        },
        { merge: true }
      );
      toast.success("Station successfully updated.");
    } catch (error) {
      console.error("Error updating station: ", error);
      toast.error("Failed to update station.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Station
        </h1>
        <Link href="/stations">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            Back to Stations
          </motion.button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Slot Info Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Slot Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Slots
                </label>
                <div className="flex flex-wrap gap-4">
                  {[4, 8, 48].map((slot) => (
                    <label
                      key={slot}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        value={slot}
                        className="form-radio text-primary"
                        {...register("slots")}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {slot} Slots
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of PowerBanks
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  {...register("powerBank")}
                />
              </div>
            </div>
          </div>

          {/* Station Info Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Station Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formList.map((item, index) => (
                <React.Fragment key={index}>
                  {item.type === "text" && (
                    <TextField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "number" && (
                    <NumberField
                      register={register}
                      title={item.title}
                      value={item.value ?? 0}
                      defaultValue={item.default}
                    />
                  )}
                  {item.type === "textarea" && (
                    <TextAreaField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "date" && (
                    <DateField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "divider" && <Divider title={item.title} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Operating Hours Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Operating Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {["su", "mo", "tu", "we", "th", "fr", "sa"].map((day) => (
                <React.Fragment key={day}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {day.toUpperCase()} Start
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      {...register(`${day}Start`)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {day.toUpperCase()} End
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      {...register(`${day}End`)}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-6.5 flex justify-end gap-4">
            <Link href="/stations">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="flex items-center gap-2 rounded bg-gray-100 dark:bg-gray-800 px-6 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  Updating Station...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-5 h-5" />
                  Update Station
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Media Section */}
      <StationMedia stationId={params.stationId} />
    </div>
  );
}

export default withRoleAuth(EditStation, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
