import { NextResponse } from "next/server";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { DB } from "@/firebase";
import { RentUpdateData } from "@/types/rent";

export async function PUT(request) {
  try {
    const body = await request.json();
    const { rentId, endStationId, endDate } = body;

    // Validate required fields
    if (!rentId) {
      return NextResponse.json(
        { error: "Rent ID is required" },
        { status: 400 }
      );
    }

    if (!endStationId) {
      return NextResponse.json(
        { error: "End Station ID is required" },
        { status: 400 }
      );
    }

    if (!endDate) {
      return NextResponse.json(
        { error: "End date/time is required" },
        { status: 400 }
      );
    }

    // Get the current rent document
    const rentRef = doc(DB, "rents", rentId);
    const rentDoc = await getDoc(rentRef);

    if (!rentDoc.exists()) {
      return NextResponse.json({ error: "Rent not found" }, { status: 404 });
    }

    const currentRent = rentDoc.data();

    // Check if rent is in "renting" status
    if (currentRent.status !== "renting") {
      return NextResponse.json(
        {
          error: `Rent is not in renting status. Current status: ${currentRent.status}`,
        },
        { status: 400 }
      );
    }

    // Calculate usage duration if startDate exists
    let usageDuration = 0;
    if (currentRent.startDate) {
      const startTime = currentRent.startDate.toDate();
      const endTime = endDate.toDate ? endDate.toDate() : new Date(endDate);
      usageDuration = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      ); // Convert to minutes
    }

    // Prepare update data
    const updateData: RentUpdateData = {
      endStationId,
      endDate: endDate.toDate ? endDate : serverTimestamp(),
      status: "rented",
      usageDuration,
      updatedAt: serverTimestamp(),
    };

    // Update the rent document
    await updateDoc(rentRef, updateData);

    return NextResponse.json({
      success: true,
      message: "Rent status updated successfully",
      data: {
        rentId,
        endStationId,
        endDate: updateData.endDate,
        status: "rented",
        usageDuration,
      },
    });
  } catch (error) {
    console.error("Error updating rent status:", error);
    return NextResponse.json(
      { error: "Failed to update rent status" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rentId = searchParams.get("rentId");

    if (!rentId) {
      return NextResponse.json(
        { error: "Rent ID is required" },
        { status: 400 }
      );
    }

    const rentRef = doc(DB, "rents", rentId);
    const rentDoc = await getDoc(rentRef);

    if (!rentDoc.exists()) {
      return NextResponse.json({ error: "Rent not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rentDoc.id,
        ...rentDoc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching rent:", error);
    return NextResponse.json(
      { error: "Failed to fetch rent" },
      { status: 500 }
    );
  }
}
