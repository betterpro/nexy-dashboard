"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { DB } from "@/firebase";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ScreenLayoutForm from "@/components/Screen/ScreenLayoutForm";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";

const ScreenEdit = () => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { stationId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const stationRef = doc(DB, "Stations", stationId);
        const stationDoc = await getDoc(stationRef);

        if (stationDoc.exists()) {
          const data = stationDoc.data();

          // Parse layout_json if it's a string, otherwise use as is
          let layoutJson = data.layout_json || {
            top: {
              height: 80,
              assets: [],
            },
            bottom: {
              height: 20,
              assets: [],
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
                  assets: [],
                },
                bottom: {
                  height: 20,
                  assets: [],
                },
              };
            }
          }

          setStation({
            id: stationDoc.id,
            ...data,
            layout_json: layoutJson,
          });
        } else {
          console.error("Station not found");
          router.push("/screen");
        }
      } catch (error) {
        console.error("Error fetching station:", error);
        router.push("/screen");
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      fetchStation();
    }
  }, [stationId, router]);

  const handleSave = async (layoutData) => {
    try {
      setSaving(true);
      const stationRef = doc(DB, "Stations", stationId);
      await updateDoc(stationRef, {
        layout_json: layoutData, // layoutData is now a JSON string
      });

      // Update local state with parsed object for display
      setStation((prev) => ({
        ...prev,
        layout_json:
          typeof layoutData === "string" ? JSON.parse(layoutData) : layoutData,
      }));

      alert("Screen layout saved successfully!");
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Error saving layout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <Breadcrumb pageName={`Screen Layout - ${station.stationTitle}`} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Edit Screen Layout
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Station:</span>
            <span className="font-semibold">{station.stationId}</span>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <ScreenLayoutForm
            layout={station.layout_json}
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
