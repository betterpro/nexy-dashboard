"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react/dist/iconify.js";

const StationManagement = () => {
  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const { stationId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const fetchStationData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/station/${stationId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch station data");
        }

        setStationData(data);
      } catch (error) {
        console.error("Error fetching station data:", error);
        toast.error(`Error fetching station data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (stationId && user) {
      fetchStationData();
    }
  }, [stationId, user, authLoading]);

  const handleReleaseAllSlots = async () => {
    if (!stationData?.batteries || stationData.batteries.length === 0) {
      toast.warning("No batteries found to release");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to release all ${stationData.batteries.length} slots?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setReleasing(true);

      // Create form data for each slot
      const formData = new FormData();
      stationData.batteries.forEach((battery) => {
        formData.append("slot_id", battery.slot_id);
      });

      const response = await fetch(`/api/station/${stationId}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to release slots");
      }

      toast.success("All slots released successfully!");

      // Refresh the data
      const refreshResponse = await fetch(`/api/station/${stationId}`);
      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        setStationData(refreshData);
      }
    } catch (error) {
      console.error("Error releasing slots:", error);
      toast.error(`Error releasing slots: ${error.message}`);
    } finally {
      setReleasing(false);
    }
  };

  const getBatteryStatusColor = (battery) => {
    if (
      battery.battery_abnormal ||
      battery.cable_abnormal ||
      battery.contact_abnormal
    ) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    if (battery.battery_capacity === "100") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getBatteryStatusText = (battery) => {
    if (battery.battery_abnormal) return "Battery Abnormal";
    if (battery.cable_abnormal) return "Cable Abnormal";
    if (battery.contact_abnormal) return "Contact Abnormal";
    if (battery.battery_capacity === "100") return "Fully Charged";
    return `${battery.battery_capacity}% Charged`;
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!stationData) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Station data not found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName={`Station Management - ${stationId}`} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Station Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Station ID:</span>
              <span className="font-semibold">{stationId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">IMEI:</span>
              <span className="font-semibold">{stationData.imei}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">ICCID:</span>
              <span className="font-semibold">
                {stationData.iccid || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Station Info Card */}
        <div className="mb-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Station Information
            </h3>
            <button
              onClick={handleReleaseAllSlots}
              disabled={releasing || !stationData.batteries?.length}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {releasing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="material-symbols:lock-open" className="h-4 w-4" />
              )}
              {releasing ? "Releasing..." : "Release All Slots"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="material-symbols:phone-android"
                  className="h-6 w-6 text-primary"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  IMEI
                </p>
                <p className="text-sm text-gray-500">{stationData.imei}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="material-symbols:sim-card"
                  className="h-6 w-6 text-primary"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  ICCID
                </p>
                <p className="text-sm text-gray-500">
                  {stationData.iccid || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="material-symbols:battery-charging-full"
                  className="h-6 w-6 text-primary"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  Total Batteries
                </p>
                <p className="text-sm text-gray-500">
                  {stationData.batteries?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Batteries Grid */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Battery Status
          </h3>

          {!stationData.batteries || stationData.batteries.length === 0 ? (
            <div className="text-center py-8">
              <Icon
                icon="material-symbols:battery-unknown"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
              />
              <p className="text-gray-500">No batteries found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stationData.batteries.map((battery, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-stroke bg-gray-50 dark:border-strokedark dark:bg-boxdark p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="material-symbols:battery-charging-full"
                        className="h-5 w-5 text-primary"
                      />
                      <span className="font-semibold text-black dark:text-white">
                        Slot {battery.slot_id}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getBatteryStatusColor(
                        battery
                      )}`}
                    >
                      {getBatteryStatusText(battery)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Battery ID:</span>
                      <span className="text-black dark:text-white font-mono text-xs">
                        {battery.battery_id}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="text-black dark:text-white">
                        {battery.battery_capacity}%
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lock Status:</span>
                      <span className="text-black dark:text-white">
                        {battery.lock_status || "Unknown"}
                      </span>
                    </div>

                    {(battery.battery_abnormal ||
                      battery.cable_abnormal ||
                      battery.contact_abnormal) && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Issues Detected:
                        </p>
                        <ul className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {battery.battery_abnormal && (
                            <li>• Battery Abnormal</li>
                          )}
                          {battery.cable_abnormal && <li>• Cable Abnormal</li>}
                          {battery.contact_abnormal && (
                            <li>• Contact Abnormal</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(StationManagement, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
]);
