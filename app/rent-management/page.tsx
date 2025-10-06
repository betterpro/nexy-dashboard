"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { DB } from "@/firebase";
import { useAuth } from "@/components/context/AuthContext";
import RentStatusUpdate from "@/components/Rent/RentStatusUpdate";
import { getRentById } from "@/utils/rentService";
import Moment from "react-moment";
import { Rent } from "@/types/rent";

const RentManagement = () => {
  const { user, userRole } = useAuth();
  const [rents, setRents] = useState<Rent[]>([]);
  const [selectedRent, setSelectedRent] = useState<Rent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRentingRents = async () => {
    try {
      setLoading(true);
      const rentsCollection = collection(DB, "rents");
      const rentsQuery = query(
        rentsCollection,
        where("status", "==", "renting"),
        orderBy("startDate", "desc"),
        limit(20)
      );

      const rentsSnapshot = await getDocs(rentsQuery);
      const rentsList = rentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Rent[];

      setRents(rentsList);
    } catch (error) {
      console.error("Error fetching renting rents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentingRents();
  }, []);

  const handleRentUpdateSuccess = () => {
    fetchRentingRents(); // Refresh the list
    setSelectedRent(null);
  };

  const handleSelectRent = async (rentId: string) => {
    const result = await getRentById(rentId);
    if (result.success) {
      setSelectedRent(result.data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Rent Management
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rents List */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Active Rents (Status: Renting)
          </h4>

          {rents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No active rents found.
            </p>
          ) : (
            <div className="space-y-4">
              {rents.map((rent) => (
                <div
                  key={rent.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedRent?.id === rent.id
                      ? "border-primary bg-primary/5"
                      : "border-stroke hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectRent(rent.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        Rent ID: {rent.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start Station: {rent.startStationId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Customer: {rent.customerId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Started:{" "}
                        <Moment format="MMM D, YYYY h:mm A">
                          {rent.startDate?.toDate()}
                        </Moment>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                        {rent.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Update Form */}
        <div>
          {selectedRent ? (
            <RentStatusUpdate
              rentId={selectedRent.id}
              onSuccess={handleRentUpdateSuccess}
            />
          ) : (
            <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Select a Rent
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Click on a rent from the list to update its status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentManagement;
