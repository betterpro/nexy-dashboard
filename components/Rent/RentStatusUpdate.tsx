"use client";
import { useState } from "react";
import { updateRentToRented } from "@/utils/rentService";
import { toast } from "react-toastify";

interface RentStatusUpdateProps {
  rentId: string;
  onSuccess?: () => void;
}

const RentStatusUpdate = ({ rentId, onSuccess }: RentStatusUpdateProps) => {
  const [endStationId, setEndStationId] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateRentStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!endStationId.trim()) {
      toast.error("Please enter the end station ID");
      return;
    }

    if (!endDate) {
      toast.error("Please select the end date and time");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateRentToRented(
        rentId,
        endStationId,
        new Date(endDate)
      );

      if (result.success) {
        toast.success(result.message || "Rent status updated successfully!");
        setEndStationId("");
        setEndDate("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update rent status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating rent status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Update Rent Status
      </h4>

      <form onSubmit={handleUpdateRentStatus} className="space-y-4">
        <div>
          <label className="mb-2.5 block text-black dark:text-white">
            End Station ID
          </label>
          <input
            type="text"
            value={endStationId}
            onChange={(e) => setEndStationId(e.target.value)}
            placeholder="Enter the station ID where the rent ended"
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="mb-2.5 block text-black dark:text-white">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Updating..." : "Update to Rented Status"}
        </button>
      </form>
    </div>
  );
};

export default RentStatusUpdate;
