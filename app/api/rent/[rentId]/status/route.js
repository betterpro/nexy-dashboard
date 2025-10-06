import { NextResponse } from "next/server";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { DB } from "@/firebase";

// Valid status transitions
const VALID_STATUSES = [
  "renting",
  "rented",
  "paid",
  "in_progress",
  "cancelled",
];

// Status transition rules
const STATUS_TRANSITIONS = {
  renting: ["rented", "cancelled"],
  rented: ["paid", "cancelled"],
  paid: [], // Final state
  in_progress: ["renting", "rented", "cancelled"],
  cancelled: [], // Final state
};

export async function PUT(request) {
  try {
    const body = await request.json();
    const { rentId, status, endStationId, endDate } = body;

    // Validate required fields
    if (!rentId) {
      return NextResponse.json(
        { error: "Rent ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid statuses are: ${VALID_STATUSES.join(
            ", "
          )}`,
        },
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
    const currentStatus = currentRent.status;

    // Check if status transition is valid
    if (currentStatus === status) {
      return NextResponse.json(
        { error: "Rent is already in this status" },
        { status: 400 }
      );
    }

    // Check if transition is allowed
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Add additional fields based on status
    if (status === "rented") {
      // If changing to "rented", set end date and station if not already set
      if (!currentRent.endDate) {
        updateData.endDate = endDate
          ? endDate.toDate
            ? endDate
            : serverTimestamp()
          : serverTimestamp();
      }
      if (!currentRent.endStationId && endStationId) {
        updateData.endStationId = endStationId;
      } else if (!currentRent.endStationId) {
        // Use start station as fallback
        updateData.endStationId = currentRent.startStationId;
      }

      // Calculate usage duration if startDate exists and endDate is being set
      if (currentRent.startDate && !currentRent.usageDuration) {
        const startTime = currentRent.startDate.toDate();
        const endTime = updateData.endDate.toDate
          ? updateData.endDate.toDate()
          : new Date();
        updateData.usageDuration = Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        ); // Convert to minutes
      }
    }

    // Update the rent document
    await updateDoc(rentRef, updateData);

    return NextResponse.json({
      success: true,
      message: `Rent status updated from ${currentStatus} to ${status} successfully`,
      data: {
        rentId,
        previousStatus: currentStatus,
        newStatus: status,
        updatedAt: updateData.updatedAt,
        ...(updateData.endDate && { endDate: updateData.endDate }),
        ...(updateData.endStationId && {
          endStationId: updateData.endStationId,
        }),
        ...(updateData.usageDuration && {
          usageDuration: updateData.usageDuration,
        }),
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

    const rentData = rentDoc.data();
    const currentStatus = rentData.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    return NextResponse.json({
      success: true,
      data: {
        id: rentDoc.id,
        currentStatus,
        allowedTransitions,
        validStatuses: VALID_STATUSES,
        ...rentData,
      },
    });
  } catch (error) {
    console.error("Error fetching rent status info:", error);
    return NextResponse.json(
      { error: "Failed to fetch rent status info" },
      { status: 500 }
    );
  }
}
