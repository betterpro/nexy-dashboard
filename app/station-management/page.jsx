"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react/dist/iconify.js";

const StationManagementList = () => {
  const [stationId, setStationId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stationId.trim()) {
      toast.error("Please enter a station ID");
      return;
    }
    router.push(`/station-management/${stationId.trim()}`);
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="Station Management" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Station Management
          </h2>
        </div>

        {/* Station ID Input Form */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Enter Station ID
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the station ID to manage battery slots and view station
              information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Icon
                    icon="material-symbols:ev-station-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter Station ID (e.g., STATION001, ZAPP481706094601)"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-strokedark dark:bg-boxdark dark:text-white text-lg"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !stationId.trim()}
                className="flex items-center gap-2 rounded bg-primary px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Icon
                    icon="material-symbols:arrow-forward"
                    className="h-5 w-5"
                  />
                )}
                {loading ? "Loading..." : "Manage Station"}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon
                icon="material-symbols:info-outline"
                className="h-5 w-5 text-blue-500 mt-0.5"
              />
              <div>
                <h4 className="text-sm font-medium text-black dark:text-white mb-1">
                  How to find Station ID:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Check the station hardware label or documentation</li>
                  <li>• Look for the IMEI number (e.g., ZAPP481706094601)</li>
                  <li>• Use the station identifier from your station list</li>
                  <li>• Contact your system administrator if unsure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Stations (Optional - can be added later) */}
        <div className="mt-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Quick Access
          </h3>
          <div className="text-center py-8">
            <Icon
              icon="material-symbols:history"
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
            />
            <p className="text-gray-500 mb-2">No recent stations</p>
            <p className="text-sm text-gray-400">
              Recently accessed stations will appear here for quick management
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(StationManagementList, [ROLES.SUPER_ADMIN]);
