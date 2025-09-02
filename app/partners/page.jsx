"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { DB } from "@/firebase";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import Image from "next/image";
import { useAuth } from "@/components/context/AuthContext";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import { useRouter } from "next/navigation";

const PartnersList = () => {
  const { user, userRole, loading } = useAuth();
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setIsLoading(true);
        let partnersQuery;

        if (userRole === ROLES.SUPER_ADMIN) {
          // Super admin can see all partners
          partnersQuery = query(
            collection(DB, "users"),
            where("role", "==", "partner")
          );
        } else if (userRole === ROLES.FRANCHISEE) {
          // Franchisee can only see partners in their franchise
          // Check if franchiseeId exists and is not undefined
          if (!user?.franchiseeId) {
            console.error("Franchisee user missing franchiseeId:", user);
            setPartners([]);
            setIsLoading(false);
            return;
          }

          partnersQuery = query(
            collection(DB, "users"),
            where("role", "==", "partner"),
            where("franchiseeId", "==", user.franchiseeId)
          );
        }

        // Ensure we have a valid query before proceeding
        if (!partnersQuery) {
          console.error("No valid query constructed for user role:", userRole);
          setPartners([]);
          setIsLoading(false);
          return;
        }

        const partnersSnapshot = await getDocs(partnersQuery);
        const partnersList = partnersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPartners(partnersList);
      } catch (error) {
        console.error("Error fetching partners:", error);
        toast.error("Failed to fetch partners");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchPartners();
    }
  }, [user, userRole, loading]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Partners List
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Logo
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Name
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Phone
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Share
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Create Date
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Station ID
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr
                  key={partner.id}
                  className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4"
                >
                  <td className="py-4 px-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-meta-4">
                      {partner.partnerLogo ? (
                        <Image
                          src={partner.partnerLogo}
                          alt={`${partner.partnerName} logo`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon
                            icon="mdi:account"
                            className="w-6 h-6 text-gray-400 dark:text-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-black dark:text-white">
                      {partner.partnerName}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-black dark:text-white">
                      {partner.phoneNumber}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-black dark:text-white">
                      {partner.partnerShare}%
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-black dark:text-white">
                      {partner.startContract
                        ? new Date(
                            partner.startContract.toDate()
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-black dark:text-white">
                      {partner.stationId || "N/A"}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        router.push(`/partners/${partner.id}/edit`)
                      }
                      className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                    >
                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                      Edit
                    </motion.button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-4 px-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No partners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default withRoleAuth(PartnersList, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
]);
