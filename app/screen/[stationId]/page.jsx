"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { DB } from "@/firebase";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ScreenLayoutForm from "@/components/Screen/ScreenLayoutForm";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";
import { toast } from "react-toastify";

const ScreenEdit = () => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { stationId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't fetch station if auth is still loading
    if (authLoading) {
      return;
    }

    const fetchStation = async () => {
      try {
        setLoading(true);
        const stationRef = doc(DB, "Stations", stationId);
        const stationDoc = await getDoc(stationRef);

        if (stationDoc.exists()) {
          const data = stationDoc.data();

          // Check if user has permission to access this station
          if (
            user?.role === ROLES.FRANCHISEE &&
            data.franchiseeId !== user.franchiseeId
          ) {
            toast.error("You don't have permission to access this station");
            router.push("/screen");
            return;
          }

          // Handle layout_json with new data structure
          let layoutJson = data.layout_json || {
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
          };

          // If layout_json is a string, parse it
          if (typeof layoutJson === "string") {
            try {
              layoutJson = JSON.parse(layoutJson);
            } catch (error) {
              console.error("Error parsing layout_json:", error);
              // Use default layout if parsing fails
              layoutJson = {
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
              };
            }
          }

          setStation({
            id: stationDoc.id,
            ...data,
            layout_json: layoutJson,
            release_dialog: data.release_dialog || {
              backgroundColor: "#CC001A57",
              duration: 5,
              icon: "",
              subtitle: "Have a safe ride!",
              subtitleObj: {
                sizeSp: 14,
              },
              title: "Battery Released",
              titleObj: {
                bold: true,
                sizeSp: 24,
              },
            },
            return_dialog: data.return_dialog || {
              backgroundColor: "#CC101010",
              backgroundImage: "",
              duration: 6,
              gravity: "center",
              icon: {
                sizeDp: 96,
                url: "",
                visible: true,
                paddingDp: 24,
              },
              subtitle: "Thank you!",
              subtitleObj: {
                color: "#DDDDDD",
                sizeSp: 26,
              },
              title: "Battery Returned",
              titleObj: {
                bold: true,
                color: "#FFFFFF",
                sizeSp: 26,
              },
            },
          });
        } else {
          console.error("Station not found");
          toast.error("Station not found");
          router.push("/screen");
        }
      } catch (error) {
        console.error("Error fetching station:", error);
        toast.error("Error fetching station data");
        router.push("/screen");
      } finally {
        setLoading(false);
      }
    };

    if (stationId && user) {
      fetchStation();
    }
  }, [stationId, router, user, authLoading]);

  const handleSave = async (
    layoutData,
    releaseDialogData,
    returnDialogData
  ) => {
    try {
      setSaving(true);
      const stationRef = doc(DB, "Stations", stationId);

      // Prepare update object
      const updateData = {
        layout_json: layoutData,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add dialog data if provided
      if (releaseDialogData) {
        updateData.release_dialog = releaseDialogData;
      }
      if (returnDialogData) {
        updateData.return_dialog = returnDialogData;
      }

      // Update the station document
      await updateDoc(stationRef, updateData);

      // Update local state
      setStation((prev) => ({
        ...prev,
        layout_json:
          typeof layoutData === "string" ? JSON.parse(layoutData) : layoutData,
        release_dialog: releaseDialogData || prev.release_dialog,
        return_dialog: returnDialogData || prev.return_dialog,
      }));

      toast.success("Screen layout saved successfully!");
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Error saving layout. Please try again.");
    } finally {
      setSaving(false);
    }
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

  if (!station) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Station not found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb
          pageName={`Screen Layout - ${station.name || station.stationId}`}
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Edit Screen Layout
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Station:</span>
              <span className="font-semibold">
                {station.stationId || station.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Name:</span>
              <span className="font-semibold">{station.name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  station.status === "online"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {station.status || "unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <ScreenLayoutForm
            layout={station.layout_json}
            releaseDialog={station.release_dialog}
            returnDialog={station.return_dialog}
            onSave={handleSave}
            saving={saving}
            stationId={stationId}
          />
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(ScreenEdit, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
