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
  const { user, userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log("user", user);

    // Don't fetch stations if user is not loaded yet or if still loading
    if (authLoading || !user || !user.role) {
      return;
    }

    // For partner users, check if partnerId is available
    if (user.role === "partner" && !user.partnerId) {
      console.warn(
        "Partner user has no partnerId assigned. Showing empty list."
      );
      setStations([]);
      setLoading(false);
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
        } else if (user.role === "partner") {
          // Partner can only see their own stations
          console.log("partnerId", user?.partnerId);

          // Check if partnerId exists and is not undefined
          if (!user?.partnerId) {
            console.error("Partner user missing partnerId:", user);
            setStations([]);
            setLoading(false);
            return;
          }

          stationsQuery = query(
            collection(DB, "Stations"),
            where("partnerId", "==", user.partnerId)
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
            // Ensure layout_json exists with default structure for new stations
            layout_json: data.layout_json || {
              top: {
                height: 80,
                assets: [
                  {
                    duration: 5,
                    link: "",
                    type: "image",
                  },
                ],
              },
              bottom: {
                height: 20,
                assets: [
                  {
                    duration: 5,
                    link: "",
                    type: "image",
                  },
                ],
              },
              layout_size: {
                height: 1280,
                width: 800,
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
  }, [userRole, user?.uid, authLoading]);

  if (authLoading || loading) {
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

        {/* Approval Notice for Partners */}
        {userRole === ROLES.PARTNER && (
          <div className="mb-6 rounded-lg border-l-4 border-warning bg-warning bg-opacity-10 p-4 shadow-md dark:bg-warning dark:bg-opacity-10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning bg-opacity-20">
                <svg
                  className="fill-current text-warning"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0ZM10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14C11 14.5523 10.5523 15 10 15ZM11 11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V11Z"
                    fill=""
                  />
                </svg>
              </div>
              <div className="w-full">
                <h5 className="mb-2 text-base font-semibold text-warning">
                  Approval Required
                </h5>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  Your screen layout changes will be submitted to Nexy for
                  review. All changes require approval and will take up to{" "}
                  <strong>48 hours</strong> to be reviewed and applied.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Station Screen Layouts
          </h2>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            {stations.length === 0 && !loading ? (
              <div className="py-10 text-center">
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  No stations found. Please contact your administrator to assign
                  stations to your account.
                </p>
              </div>
            ) : (
              <ScreenTable stations={stations} setStations={setStations} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(Screen, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
  ROLES.PARTNER,
]);
