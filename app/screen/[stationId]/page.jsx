"use client";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
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

          if (
            user?.role === ROLES.PARTNER &&
            data.partnerId !== user.partnerId
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

      // Send email notification if user is a partner
      if (user?.role === ROLES.PARTNER) {
        try {
          const emailData = {
            to: "reza@nexy.ca",
            message: {
              subject: `🔔 Screen Layout Change - Approval Required - ${
                station.name || station.stationId
              }`,
              html: `
                <h2>Screen Layout Change Submitted for Approval</h2>
                <p>A partner has submitted screen layout changes for a station that require your approval.</p>
                <hr>
                <h3>Station Details:</h3>
                <ul>
                  <li><strong>Station ID:</strong> ${
                    station.stationId || stationId
                  }</li>
                  <li><strong>Station Name:</strong> ${
                    station.name || "N/A"
                  }</li>
                  <li><strong>Partner:</strong> ${
                    user.fullName || user.email || "Unknown"
                  }</li>
                  <li><strong>Partner Email:</strong> ${
                    user.email || "N/A"
                  }</li>
                  <li><strong>Partner ID:</strong> ${
                    user.partnerId || "N/A"
                  }</li>
                  <li><strong>Updated At:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <hr>
                <h3>Changes Made:</h3>
                <ul>
                  ${layoutData ? "<li>✓ Screen layout updated</li>" : ""}
                  ${
                    releaseDialogData ? "<li>✓ Release dialog updated</li>" : ""
                  }
                  ${returnDialogData ? "<li>✓ Return dialog updated</li>" : ""}
                </ul>
                <hr>
                <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0;">
                  ⚠️ <strong>Action Required:</strong> Please review and approve these changes within 48 hours.
                </p>
                <p>Please review the changes in the dashboard and approve or reject them.</p>
                <p><a href="${
                  window.location.origin
                }/screen/${stationId}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View & Approve Changes</a></p>
              `,
              text: `
Screen Layout Change Submitted for Approval

A partner has submitted screen layout changes for a station that require your approval.

⚠️ ACTION REQUIRED: Please review and approve these changes within 48 hours.

Station Details:
- Station ID: ${station.stationId || stationId}
- Station Name: ${station.name || "N/A"}
- Partner: ${user.fullName || user.email || "Unknown"}
- Partner Email: ${user.email || "N/A"}
- Partner ID: ${user.partnerId || "N/A"}
- Updated At: ${new Date().toLocaleString()}

Changes Made:
${layoutData ? "✓ Screen layout updated" : ""}
${releaseDialogData ? "✓ Release dialog updated" : ""}
${returnDialogData ? "✓ Return dialog updated" : ""}

Please review the changes in the dashboard and approve or reject them.
View & Approve: ${window.location.origin}/screen/${stationId}
              `,
            },
          };

          // Add email to the mail collection (Trigger Email extension)
          await addDoc(collection(DB, "mail"), emailData);
          console.log("Email notification queued successfully");
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't show error to user, just log it
        }
      }

      if (user?.role === ROLES.PARTNER) {
        toast.success(
          "Screen layout submitted for approval! Changes will be reviewed within 48 hours."
        );
      } else {
        toast.success("Screen layout saved successfully!");
      }
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

        {/* Approval Notice for Partners */}
        {user?.role === ROLES.PARTNER && (
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
                  <strong>48 hours</strong> to be reviewed and applied. You will
                  receive a notification once your changes have been approved.
                </p>
              </div>
            </div>
          </div>
        )}

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

export default withRoleAuth(ScreenEdit, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
  ROLES.PARTNER,
]);
