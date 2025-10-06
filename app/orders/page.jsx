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
import { updateRentStatus, getRentStatusInfo } from "@/utils/rentService";

const OrdersList = () => {
  const { user, userRole, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  const fetchOrders = async (isInitial = false) => {
    try {
      setIsLoading(true);
      let ordersQuery;

      // Base query with ordering by startDate and limit

      // Apply role-based filtering
      if (userRole === ROLES.SUPER_ADMIN) {
        ordersQuery = query(
          collection(DB, "rents"),
          orderBy("startDate", "desc"),
          limit(pageSize)
        );
      } else if (userRole === ROLES.FRANCHISEE) {
        // Check if franchiseeId exists and is not undefined
        if (!user?.franchiseeId) {
          console.error("Franchisee user missing franchiseeId:", user);
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const stationsQuery = query(
          collection(DB, "stations"),
          where("franchiseeId", "==", user.franchiseeId)
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

  const handleStatusChange = async (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);

    try {
      const result = await getRentStatusInfo(order.id);
      if (result.success) {
        setAllowedTransitions(result.data.allowedTransitions || []);
      } else {
        // Fallback to all statuses if API fails
        setAllowedTransitions([
          "renting",
          "rented",
          "paid",
          "in_progress",
          "cancelled",
        ]);
      }
    } catch (error) {
      console.error("Error fetching status info:", error);
      // Fallback to all statuses
      setAllowedTransitions([
        "renting",
        "rented",
        "paid",
        "in_progress",
        "cancelled",
      ]);
    }

    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) {
      toast.error("Please select a status");
      return;
    }

    if (newStatus === selectedOrder.status) {
      toast.info("Status is already set to this value");
      setShowStatusModal(false);
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const result = await updateRentStatus(
        selectedOrder.id,
        newStatus,
        selectedOrder.endStationId || selectedOrder.startStationId,
        new Date()
      );

      if (result.success) {
        // Update the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus, updatedAt: new Date() }
              : order
          )
        );

        toast.success(
          result.message || `Status updated to ${newStatus} successfully!`
        );
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus("");
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setNewStatus("");
    setAllowedTransitions([]);
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
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
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
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleStatusChange(order)}
                      className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                      <Icon icon="mdi:pencil" className="w-3 h-3" />
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
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

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Change Rent Status
              </h3>
              <button
                onClick={closeStatusModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {selectedOrder && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-meta-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Order ID:</strong> {selectedOrder.id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Battery ID:</strong>{" "}
                  {selectedOrder.battery_id || "N/A"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Current Status:</strong> {selectedOrder.status}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              >
                <option value={selectedOrder?.status}>
                  {selectedOrder?.status} (current)
                </option>
                {allowedTransitions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
              {allowedTransitions.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No status transitions available from current status
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeStatusModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={
                  isUpdatingStatus || newStatus === selectedOrder?.status
                }
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdatingStatus ? (
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default withRoleAuth(OrdersList, [
  ROLES.SUPER_ADMIN,
  ROLES.FRANCHISEE,
  ROLES.PARTNER,
]);
