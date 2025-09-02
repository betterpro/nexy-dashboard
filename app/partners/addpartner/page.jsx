"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { auth, DB, storage } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/context/AuthContext";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";

const CreateUser = () => {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();
  const { register, handleSubmit, control, setValue } = useForm();
  const [logoPreview, setLogoPreview] = useState("");
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (loading) return;

    const fetchStations = async () => {
      try {
        // First, get all stations based on user role
        let stationsQuery;
        if (userRole === "superadmin") {
          stationsQuery = query(collection(DB, "stations"));
        } else if (userRole === "franchisee") {
          // Check if franchiseeId exists and is not undefined
          if (!user?.franchiseeId) {
            console.error("Franchisee user missing franchiseeId:", user);
            setStations([]);
            return;
          }

          stationsQuery = query(
            collection(DB, "stations"),
            where("franchiseeId", "==", user.franchiseeId)
          );
        }

        const stationsSnapshot = await getDocs(stationsQuery);
        const stationsList = stationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Then, get all partners to check which stations are already assigned
        const partnersQuery = query(
          collection(DB, "users"),
          where("role", "==", "partner")
        );
        const partnersSnapshot = await getDocs(partnersQuery);
        const assignedStationIds = partnersSnapshot.docs
          .map((doc) => doc.data().stationId)
          .filter(Boolean); // Remove any null/undefined values

        // Filter out stations that are already assigned to partners
        const availableStations = stationsList.filter(
          (station) => !assignedStationIds.includes(station.id)
        );

        setStations(availableStations);
      } catch (error) {
        console.error("Error fetching stations:", error);
        toast.error("Failed to fetch stations");
      }
    };

    fetchStations();
  }, [user, userRole, loading]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  const handleFileChange = (file) => {
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleStationToggle = (stationId) => {
    setSelectedStation(stationId);
  };

  const uploadLogo = async (file) => {
    if (!file) return "";
    const logoRef = ref(storage, `partners-user/${file.name}`);
    await uploadBytes(logoRef, file);
    return await getDownloadURL(logoRef);
  };

  const createPartnerData = (data, logoURL) => ({
    email: data.email,
    partnerName: data.partnerName,
    phoneNumber: data.phoneNumber,
    partnerShare: Number(data.partnerShare),
    role: "partner",
    startContract: Timestamp.now(),
    stationId: selectedStation,
    franchiseeId: user?.franchiseeId ?? "",
    ...(logoURL && { partnerLogo: logoURL }),
  });

  const handleUserCreation = async (data, userData, existingUserDoc) => {
    let userId;

    if (existingUserDoc?.docs.length > 0) {
      if (existingUserDoc.docs.length > 1) {
        throw new Error("Two accounts with same email");
      }
      userId = existingUserDoc.docs[0].id;
    } else {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      userId = user.uid;
    }

    await setDoc(doc(DB, "users", userId), userData, { merge: true });
    return existingUserDoc?.docs.length > 0
      ? "Partner updated successfully"
      : "Partner created successfully!";
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      // Upload logo if provided
      const logoURL = data.partnerLogo?.[0]
        ? await uploadLogo(data.partnerLogo[0])
        : "";

      // Create partner data
      const userData = createPartnerData(data, logoURL);

      // Check if user exists
      const userQuery = query(
        collection(DB, "users"),
        where("email", "==", data.email)
      );
      const userDoc = await getDocs(userQuery);

      // Handle user creation/update
      const successMessage = await handleUserCreation(data, userData, userDoc);
      toast.success(successMessage);
    } catch (error) {
      console.error("Error creating/updating partner: ", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Partner
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6.5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                {...register("email", { required: true })}
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                {...register("password")}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Partner Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                {...register("partnerName", { required: true })}
                placeholder="Enter partner name"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                {...register("phoneNumber", { required: true })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Partner Share
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                step="0.1"
                {...register("partnerShare", { required: true })}
                placeholder="Enter partner share"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                value="Partner"
                readOnly
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Contract
              </label>
              <Controller
                name="startContract"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    value={field.value || ""}
                    className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                )}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Partner Logo
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    {...register("partnerLogo")}
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke bg-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon icon="mdi:image-plus" className="w-5 h-5" />
                    <span>Choose Logo</span>
                  </label>
                </div>
                {logoPreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Partner Logo Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stations Selection */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Station
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleStationToggle(station.id)}
                  className={`flex items-center gap-4 p-3 rounded-lg border border-stroke hover:bg-gray-1 dark:border-strokedark dark:hover:bg-meta-4 cursor-pointer transition-colors ${
                    selectedStation === station.id
                      ? "bg-primary/10 border-primary dark:bg-primary/20"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedStation"
                    checked={selectedStation === station.id}
                    className="form-radio text-primary cursor-pointer"
                    readOnly
                  />
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-meta-4 flex-shrink-0">
                    {station.logo ? (
                      <Image
                        src={station.logo}
                        alt={`${station.stationTitle || "Station"} logo`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon
                          icon="mdi:ev-station"
                          className="w-6 h-6 text-gray-400 dark:text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black dark:text-white truncate">
                      {station.stationTitle || "Unnamed Station"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {station.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stations.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No available stations found. All stations are already assigned
                to partners.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !selectedStation}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-5 h-5" />
                  Save Partner
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default withRoleAuth(CreateUser, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
