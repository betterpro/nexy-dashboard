"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { DB } from "@/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import StationsTable from "@/components/Stations/table";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        let stationsQuery;

        // Create base query
        if (userRole === ROLES.SUPER_ADMIN) {
          // Super admin can see all stations
          stationsQuery = query(collection(DB, "stations"));
        } else if (userRole === ROLES.FRANCHISEE) {
          // Franchisee can only see their own stations
          stationsQuery = query(
            collection(DB, "stations"),
            where("franchiseeId", "==", user?.uid)
          );
        }

        const querySnapshot = await getDocs(stationsQuery);
        const stationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStations(stationsData);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [userRole, user?.uid]);

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="Stations" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            All Stations
          </h2>

          {userRole === ROLES.SUPER_ADMIN && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/stations/add"
                className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Add Station
              </a>
              <a
                href="/stations/addpartner"
                className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                Add Partner
              </a>
            </div>
          )}
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <StationsTable stations={stations} setStations={setStations} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Stations;
