"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { DB } from "@/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ScreenTable from "@/components/Screen/ScreenTable";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";

const Screen = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    console.log("user", user);

    // Don't fetch stations if user is not loaded yet
    if (!user || !user.role) {
      return;
    }

    const fetchStations = async () => {
      try {
        setLoading(true);
        let stationsQuery;

        // Create base query
        if (user.role === "superadmin") {
          // Super admin can see all stations
          stationsQuery = query(collection(DB, "Stations"));
        } else if (user.role === "franchisee") {
          // Franchisee can only see their own stations
          console.log("franchiseeId", user?.franchiseeId);

          // Check if franchiseeId exists and is not undefined
          if (!user?.franchiseeId) {
            console.error("Franchisee user missing franchiseeId:", user);
            setStations([]);
            setLoading(false);
            return;
          }

          stationsQuery = query(
            collection(DB, "Stations"),
            where("franchiseeId", "==", user.franchiseeId)
          );
        }

        // Ensure we have a valid query before proceeding
        if (!stationsQuery) {
          console.error("No valid query constructed for user role:", user.role);
          setStations([]);
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(stationsQuery);
        const stationsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("franchiseeId", user?.franchiseeId, data);
          return {
            id: doc.id,
            ...data,
            // Ensure layout_json exists with default structure
            layout_json: data.layout_json || {
              top: {
                height: 80,
                assets: [],
              },
              bottom: {
                height: 20,
                assets: [],
              },
            },
          };
        });

        setStations(stationsData);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [userRole, user?.uid]);

  if (loading) {
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
        <Breadcrumb pageName="Screen Management" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Station Screen Layouts
          </h2>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <ScreenTable stations={stations} setStations={setStations} />
          </div>
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(Screen, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
