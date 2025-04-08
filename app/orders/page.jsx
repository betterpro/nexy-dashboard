"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { DB } from "@/firebase";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { useAuth } from "@/components/context/AuthContext";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import Moment from "react-moment";

const OrdersList = () => {
  const { user, userRole, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = async (isInitial = false) => {
    try {
      setIsLoading(true);
      let ordersQuery;

      // Base query with ordering by startDate and limit
      const baseQuery = query(
        collection(DB, "rents"),
        orderBy("startDate", "desc"),
        limit(pageSize)
      );

      // Apply role-based filtering
      if (userRole === ROLES.SUPER_ADMIN) {
        ordersQuery = baseQuery;
      } else if (userRole === ROLES.FRANCHISEE) {
        const stationsQuery = query(
          collection(DB, "stations"),
          where("franchiseeId", "==", user.uid)
        );
        const stationsSnapshot = await getDocs(stationsQuery);
        const stationIds = stationsSnapshot.docs.map((doc) => doc.id);

        if (stationIds.length === 0) {
          setOrders([]);
          return;
        }

        ordersQuery = query(
          collection(DB, "rents"),
          where("startStationId", "in", stationIds),
          orderBy("startDate", "desc"),
          limit(pageSize)
        );
      } else if (userRole === ROLES.PARTNER) {
        ordersQuery = query(
          collection(DB, "rents"),
          where("startStationId", "==", user.stationId),
          orderBy("startDate", "desc"),
          limit(pageSize)
        );
      }

      // If not initial load and we have a last visible document, start after it
      if (!isInitial && lastVisible) {
        ordersQuery = query(ordersQuery, startAfter(lastVisible));
      }

      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update last visible document
      setLastVisible(ordersSnapshot.docs[ordersSnapshot.docs.length - 1]);
      setHasMore(ordersSnapshot.docs.length === pageSize);

      if (isInitial) {
        setOrders(ordersList);
      } else {
        setOrders((prev) => [...prev, ...ordersList]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setOrders([]);
      setLastVisible(null);
      setCurrentPage(1);
      setHasMore(true);
      fetchOrders(true);
    }
  }, [user, userRole, loading, pageSize]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setCurrentPage((prev) => prev + 1);
      fetchOrders(false);
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  if (loading && orders.length === 0) {
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
          Orders List
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Show:
          </span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded border border-stroke bg-white px-3 py-1 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
          >
            <option value={15}>15</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <div className="relative overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-2 dark:bg-meta-4">
              <tr>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Battery ID / Order ID
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Start Station
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  End Station
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Usage Duration
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Total Fee
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Status
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Start Date
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4"
                >
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {order.battery_id || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.id}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {order.startStationTitle || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.startStationId || "N/A"}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-sm text-black dark:text-white">
                      {order.returnData?.imei || order.endStationId || "N/A"}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-black dark:text-white">
                      {order.usageDuration || "0"} min
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-black dark:text-white">
                      ${order.totalPayment?.toFixed(0) / 100 || "0.00"}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-success/10 text-success"
                          : order.status === "in_progress"
                          ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {order.status}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-black dark:text-white">
                      {order.startDate ? (
                        <Moment format="MMM D, YYYY h:mm A">
                          {order.startDate.toDate()}
                        </Moment>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-black dark:text-white">
                      {order.endDate ? (
                        <Moment format="MMM D, YYYY h:mm A">
                          {order.endDate.toDate()}
                        </Moment>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {orders.length} orders
        </div>
        {hasMore && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                Load More
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default withRoleAuth(OrdersList, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
  ROLES.PARTNER,
]);
