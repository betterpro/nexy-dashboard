"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DB, storage } from "@/firebase";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import Image from "next/image";
import { useAuth } from "@/components/context/AuthContext";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import { useRouter } from "next/navigation";
import TextField from "@/theme/textField";
import NumberField from "@/theme/numberField";

const EditPartner = ({ params }) => {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm();

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setIsLoading(true);
        const partnerDoc = await getDoc(doc(DB, "users", params.id));

        if (!partnerDoc.exists()) {
          toast.error("Partner not found");
          router.push("/partners");
          return;
        }

        const partnerData = partnerDoc.data();

        // Check if user has permission to edit this partner
        if (
          userRole === ROLES.FRANCHISEE &&
          partnerData.franchiseeId !== user?.franchiseeId
        ) {
          toast.error("You don't have permission to edit this partner");
          router.push("/partners");
          return;
        }

        setPartner(partnerData);
        setLogoPreview(partnerData.partnerLogo || "");

        // Set form values
        setValue("partnerName", partnerData.partnerName);
        setValue("phoneNumber", partnerData.phoneNumber);
        setValue("partnerShare", partnerData.partnerShare);
        setValue("email", partnerData.email);
      } catch (error) {
        console.error("Error fetching partner:", error);
        toast.error("Failed to fetch partner details");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchPartner();
    }
  }, [params.id, user, userRole, loading, setValue, router]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      let logoURL = partner.partnerLogo;

      // Upload new logo if provided
      if (logoFile) {
        const logoRef = ref(storage, `partners-user/${params.id}`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      const updateData = {
        partnerName: data.partnerName,
        phoneNumber: data.phoneNumber,
        partnerShare: Number(data.partnerShare),
        updatedAt: new Date(),
        ...(logoURL && { partnerLogo: logoURL }),
      };

      await updateDoc(doc(DB, "users", params.id), updateData);
      toast.success("Partner updated successfully");
      router.push("/partners");
    } catch (error) {
      console.error("Error updating partner:", error);
      toast.error("Failed to update partner");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Partner
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/partners")}
          className="flex items-center gap-2 rounded bg-gray-2 px-6 py-2 font-medium text-gray-700 hover:bg-gray-3 dark:bg-meta-4 dark:text-white dark:hover:bg-meta-5"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5" />
          Back to Partners
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Partner Logo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                Partner Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-meta-4">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Partner logo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        icon="mdi:account"
                        className="w-10 h-10 text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
              </div>
            </div>

            {/* Partner Name */}
            <TextField
              register={register}
              title="Partner Name"
              value="partnerName"
              required
            />

            {/* Phone Number */}
            <TextField
              register={register}
              title="Phone Number"
              value="phoneNumber"
              required
            />

            {/* Partner Share */}
            <NumberField
              register={register}
              title="Partner Share (%)"
              value="partnerShare"
              required
              min={0}
              max={100}
            />

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                disabled
                className="w-full rounded border border-stroke bg-gray-100 px-4 py-2 text-gray-500 focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              />
            </div>

            {/* Station ID (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                Station ID
              </label>
              <input
                type="text"
                value={partner.stationId || "N/A"}
                disabled
                className="w-full rounded border border-stroke bg-gray-100 px-4 py-2 text-gray-500 focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !isDirty}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-5 h-5" />
                  Update Partner
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default withRoleAuth(EditPartner, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
