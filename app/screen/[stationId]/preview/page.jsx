"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { DB } from "@/firebase";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ScreenPreview from "@/components/Screen/ScreenPreview";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";

const ScreenPreviewPage = () => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { stationId } = useParams();
  const router = useRouter();

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
        <Breadcrumb pageName={`Screen Preview - ${station.name}`} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Screen Layout Preview
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Station:</span>
            <span className="font-semibold">{station.stationId}</span>
            <button
              onClick={() => router.push(`/screen/${stationId}`)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
            >
              Edit Layout
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <ScreenPreview
            layout={station.layout_json}
            layoutSize={station.layout_size}
          />
        </div>
      </div>
    </>
  );
};

export default withRoleAuth(ScreenPreviewPage, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
]);
