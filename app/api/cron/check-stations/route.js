import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { DB } from "@/firebase";
import { checkStationsAndNotify } from "@/utils/checkStations";

export async function GET(request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all stations from Firestore
    const stationsSnapshot = await getDocs(collection(DB, "stations"));
    const stations = stationsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    // Filter for ZAPP and NEXY stations
    const zappNexyStations = stations.filter(
      (station) =>
        station.stationId.startsWith("ZAPP") ||
        station.stationId.startsWith("WSEP") ||
        station.stationId.startsWith("NEXY")
    );

    // Check stations and send notifications
    const result = await checkStationsAndNotify(zappNexyStations);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in station check:", error);
    return NextResponse.json(
      { error: "Failed to check stations" },
      { status: 500 }
    );
  }
}
