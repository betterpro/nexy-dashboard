"use client";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore"; // Import Firebase functions
import { DB } from "@/firebase"; // Import your Firebase config
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import { getBatteryStatus } from "@/utils/batteryStatus";

const handleShowAsPartnerToggle = async (stationId, currentValue) => {
  try {
    const stationRef = doc(DB, "stations", stationId);
    await updateDoc(stationRef, {
      showAsPartner: !currentValue, // Toggle the value
    });
    Props.setStations((prevStations) =>
      prevStations.map((station) =>
        station.stationId === stationId
          ? { ...station, showAsPartner: !currentValue }
          : station
      )
    );
  } catch (error) {
    console.error("Error updating showAsPartner:", error);
  }
};

const StationsTable = (Props) => {
  const [stationData, setStationData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteStationId, setDeleteStationId] = useState(null);

  const [stationStatus, setStationStatus] = useState({
    stationId: "",
    status: "",
    batteries: 0,
  });
  const { userRole } = useAuth();

  const handleUpdateClick = async (stationId) => {
    const data = await getBatteryStatus(stationId)
      .then((data) => {
        setStationData((prevData) => [
          ...prevData.filter((item) => item.stationId !== stationId),
          { stationId, ...data },
        ]);
        setStationStatus({
          stationId: stationId,
          status: "online",
          batteries: data.batteries.length,
        });
      })
      .catch((error) => {
        console.error("Error updating station:", error);
        setStationStatus({
          stationId: stationId,
          status: "offline",
          batteries: 0,
        });
      });
  };

  // Utility function to create a delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Fetch all station data with a 2-second delay between each request
  const checkall = async () => {
    for (let station of Props.stations) {
      const data = await getBatteryStatus(station.stationId);
      setStationData((prevData) => [
        ...prevData.filter((item) => item.stationId !== station.stationId),
        { stationId: station.stationId, ...data },
      ]);
      await delay(2000); // Wait for 2 seconds before the next request
    }
  };

  const handleDeleteClick = (stationId) => {
    setDeleteStationId(stationId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (deleteStationId) {
      try {
        await deleteDoc(doc(DB, "stations", deleteStationId));
        // Update the stations list by filtering out the deleted station
        Props.setStations((prevStations) =>
          prevStations.filter(
            (station) => station.stationId !== deleteStationId
          )
        );
        // Also remove from stationData if it exists
        setStationData((prevData) =>
          prevData.filter((data) => data.stationId !== deleteStationId)
        );
      } catch (error) {
        console.error("Error deleting station:", error);
      } finally {
        setShowModal(false);
        setDeleteStationId(null);
      }
    }
  };
  console.log(stationData);
  return (
    <div className="rounded-sm ">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[40px] py-4  font-medium text-black dark:text-white xl:pl-11">
                Logo
              </th>
              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Station
              </th>
              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Status
              </th>

              <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white">
                Email
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Actions{" "}
                <button className="text-danger" onClick={checkall}>
                  check all
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {Props.stations.map((packageItem, key) => (
              <tr
                key={key}
                className={`${
                  stationStatus.stationId === packageItem.stationId
                    ? stationStatus.status === "online"
                      ? "bg-success"
                      : "bg-danger"
                    : ""
                }`}
              >
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <img
                    src={
                      packageItem.logo !== ""
                        ? packageItem.logo
                        : "/images/favicon.ico"
                    }
                    className="rounded-full h-14 w-14"
                  />
                </td>
                <td className="border-b border-[#eee] font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <p>{packageItem.stationId}</p>
                  <p>{packageItem.stationTitle}</p>
                </td>

                <td className="border-b border-[#eee] font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <p>
                    PowerBank: {packageItem.powerBank}
                    {stationStatus.batteries > 0 &&
                      stationStatus.stationId === packageItem.stationId &&
                      stationStatus.status === "online" && (
                        <span className="font-bold ml-2 text-danger">
                          {stationStatus.batteries}
                        </span>
                      )}
                    {stationStatus.stationId === packageItem.stationId &&
                      stationStatus.status === "offline" && (
                        <span className="font-bold ml-2 text-black">
                          Offline
                        </span>
                      )}
                  </p>
                  <p>Parking: {packageItem.parking}</p>
                  <p>Price: {packageItem.price}</p>
                </td>

                <td className="border-b border-[#eee] font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <p>{packageItem?.owner?.email}</p>
                  <p>{packageItem?.owner?.phoneNumber}</p>
                  <p>{packageItem?.owner?.partnerName}</p>
                </td>
                <td className="border-b border-[#eee] font-normal text-xs py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <div className="flex gap-5 items-center space-x-3">
                    <Link href={`/stations/${packageItem.stationId}`}>
                      <Icon icon="basil:edit-outline" height={20} />
                    </Link>
                    {userRole === ROLES.SUPER_ADMIN && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={packageItem.showAsPartner}
                          onChange={() =>
                            handleShowAsPartnerToggle(
                              packageItem.stationId,
                              packageItem.showAsPartner
                            )
                          }
                          className="cursor-pointer"
                        />
                        <label className="ml-2">Show as Partner</label>
                      </div>
                    )}
                    <button
                      onClick={() => handleUpdateClick(packageItem.stationId)}
                      className="hover:text-primary"
                    >
                      <Icon height={20} icon="fluent-mdl2:sync-status" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(packageItem.stationId)}
                      className="text-danger"
                    >
                      <Icon icon="fluent:delete-20-regular" height={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded">
            <p>Are you sure you want to delete this station?</p>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-danger rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setShowModal(false)} // Close modal on "No" click
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationsTable;
