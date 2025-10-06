import { RentUpdateData } from "@/types/rent";

/**
 * Updates a rent status from "renting" to "rented"
 * @param rentId - The ID of the rent to update
 * @param endStationId - The station ID where the rent ended
 * @param endDate - The end date/time (can be Date object or Firestore Timestamp)
 * @returns Promise with the update result
 */
export async function updateRentToRented(
  rentId: string,
  endStationId: string,
  endDate: Date | any
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/rent/${rentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rentId,
        endStationId,
        endDate,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update rent status",
      };
    }

    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating rent status:", error);
    return {
      success: false,
      error: "Network error occurred while updating rent status",
    };
  }
}

/**
 * Updates a rent status to any valid status
 * @param rentId - The ID of the rent to update
 * @param status - The new status
 * @param endStationId - Optional end station ID (required for some transitions)
 * @param endDate - Optional end date (required for some transitions)
 * @returns Promise with the update result
 */
export async function updateRentStatus(
  rentId: string,
  status: string,
  endStationId?: string,
  endDate?: Date
): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/rent/${rentId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rentId,
        status,
        endStationId,
        endDate,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update rent status",
      };
    }

    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating rent status:", error);
    return {
      success: false,
      error: "Network error occurred while updating rent status",
    };
  }
}

/**
 * Gets rent status information including allowed transitions
 * @param rentId - The ID of the rent to fetch
 * @returns Promise with the rent status data
 */
export async function getRentStatusInfo(rentId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/rent/${rentId}/status?rentId=${rentId}`);

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to fetch rent status info",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error fetching rent status info:", error);
    return {
      success: false,
      error: "Network error occurred while fetching rent status info",
    };
  }
}

/**
 * Fetches a rent by ID
 * @param rentId - The ID of the rent to fetch
 * @returns Promise with the rent data
 */
export async function getRentById(rentId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/rent/${rentId}`);

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to fetch rent",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error fetching rent:", error);
    return {
      success: false,
      error: "Network error occurred while fetching rent",
    };
  }
}
