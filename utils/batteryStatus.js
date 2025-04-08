import axios from "axios";

export async function getBatteryStatus(stationId) {
  try {
    let batteries;

    if (stationId.startsWith("ZAPP") || stationId.startsWith("WSEP")) {
      try {
        // Use our proxy endpoint for ZAPP stations
        const response = await fetch(`/api/zapp/station/${stationId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch ZAPP station data: ${
              errorData.error || response.statusText
            }`
          );
        }
        const data = await response.json();
        batteries = data.batteries;
      } catch (error) {
        console.error("Error fetching ZAPP station data:", error);
        throw error;
      }
    } else if (stationId.startsWith("NEXY")) {
      try {
        // Use our proxy endpoint for NEXY stations
        const response = await fetch(`/api/nexy/station/${stationId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch NEXY station data: ${
              errorData.error || response.statusText
            }`
          );
        }
        const data = await response.json();

        if (data.code !== 200) {
          throw new Error(
            `Failed to fetch data for NEXY station: ${
              data.message || "Unknown error"
            }`
          );
        }

        // Fetch battery data from our API
        const batteryResponse = await fetch(
          `/api/battery/status?stationId=${stationId}`
        );
        if (!batteryResponse.ok) {
          const errorData = await batteryResponse.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch battery status: ${
              errorData.error || batteryResponse.statusText
            }`
          );
        }
        const batteryData = await batteryResponse.json();
        batteries = batteryData.batteries;
      } catch (error) {
        console.error("Error in NEXY API call:", error);
        throw new Error(`Failed to fetch NEXY station data: ${error.message}`);
      }
    } else {
      throw new Error("Unsupported station ID format");
    }

    return { batteries };
  } catch (error) {
    console.error("Error fetching battery status:", error);
    throw error;
  }
}
