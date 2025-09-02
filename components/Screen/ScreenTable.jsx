"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";

const ScreenTable = (Props) => {
  const { userRole } = useAuth();

  // Helper function to parse layout JSON
  const parseLayout = (layoutJson) => {
    if (!layoutJson) {
      return {
        top: { height: 80, assets: [] },
        bottom: { height: 20, assets: [] },
      };
    }

    // If it's a string, try to parse it
    if (typeof layoutJson === "string") {
      try {
        return JSON.parse(layoutJson);
      } catch (error) {
        console.error("Error parsing layout JSON:", error);
        return {
          top: { height: 80, assets: [] },
          bottom: { height: 20, assets: [] },
        };
      }
    }

    // If it's already an object, return as is
    return layoutJson;
  };

  return (
    <div className="rounded-sm">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[40px] py-4 font-medium text-black dark:text-white xl:pl-11">
                Logo
              </th>
              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Station
              </th>
              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Screen Layout Status
              </th>
              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white">
                Top Section
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Bottom Section
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Props.stations.map((station, key) => {
              const layout = parseLayout(station.layout_json);
              const topAssets = layout.top?.assets || [];
              const bottomAssets = layout.bottom?.assets || [];
              const hasAssets = topAssets.length > 0 || bottomAssets.length > 0;

              return (
                <tr
                  key={key}
                  className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <img
                      src={
                        station.logo !== ""
                          ? station.logo
                          : "/images/favicon.ico"
                      }
                      className="rounded-full h-14 w-14 object-cover"
                      alt={station.stationTitle || station.stationId}
                      onError={(e) => {
                        e.target.src = "/images/favicon.ico";
                      }}
                    />
                  </td>
                  <td className="font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <p className="font-semibold text-sm">{station.stationId}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {station.stationTitle ||
                        station.name ||
                        "Unnamed Station"}
                    </p>
                  </td>
                  <td className="font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          hasAssets ? "bg-success" : "bg-danger"
                        }`}
                      ></div>
                      <span
                        className={`font-medium ${
                          hasAssets ? "text-success" : "text-danger"
                        }`}
                      >
                        {hasAssets ? "Configured" : "Not Configured"}
                      </span>
                    </div>
                  </td>
                  <td className="font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div>
                      <p className="font-medium">
                        Height: {layout.top?.height || 80}px
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Assets: {topAssets.length}
                      </p>
                      {topAssets.length > 0 && (
                        <div className="mt-1">
                          {topAssets.slice(0, 2).map((asset, index) => (
                            <div
                              key={index}
                              className="text-xs text-gray-500 flex items-center gap-1"
                            >
                              <Icon
                                icon={
                                  asset.type === "image"
                                    ? "mdi:image"
                                    : "mdi:video"
                                }
                                height={12}
                                className="text-gray-400"
                              />
                              {asset.type} ({asset.duration}s)
                            </div>
                          ))}
                          {topAssets.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{topAssets.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div>
                      <p className="font-medium">
                        Height: {layout.bottom?.height || 20}px
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Assets: {bottomAssets.length}
                      </p>
                      {bottomAssets.length > 0 && (
                        <div className="mt-1">
                          {bottomAssets.slice(0, 2).map((asset, index) => (
                            <div
                              key={index}
                              className="text-xs text-gray-500 flex items-center gap-1"
                            >
                              <Icon
                                icon={
                                  asset.type === "image"
                                    ? "mdi:image"
                                    : "mdi:video"
                                }
                                height={12}
                                className="text-gray-400"
                              />
                              {asset.type} ({asset.duration}s)
                            </div>
                          ))}
                          {bottomAssets.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{bottomAssets.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div className="flex gap-3 items-center">
                      <Link
                        href={`/screen/${station.stationId}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit Layout"
                      >
                        <Icon
                          icon="basil:edit-outline"
                          height={18}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary"
                        />
                      </Link>
                      <Link
                        href={`/screen/${station.stationId}/preview`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Preview Layout"
                      >
                        <Icon
                          icon="mdi:eye"
                          height={18}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary"
                        />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScreenTable;
