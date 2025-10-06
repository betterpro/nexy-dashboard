# Rent Status Update Functionality

This implementation provides a complete solution for updating rent status from "renting" to "rented" in the rents table.

## Files Created

### 1. Type Definitions (`types/rent.ts`)

- **Rent**: Complete type definition for rent documents
- **RentUpdateData**: Type for rent update operations
- Includes all necessary fields: `startStationId`, `endStationId`, `startDate`, `endDate`, `usageDuration`, `totalPayment`, `status`, etc.

### 2. API Route (`app/api/rent/[rentId]/route.js`)

- **PUT**: Updates rent status from "renting" to "rented"
- **GET**: Fetches rent by ID
- Validates required parameters (`endStationId`, `endDate`)
- Calculates usage duration automatically
- Returns comprehensive response with success/error status

### 3. Utility Service (`utils/rentService.ts`)

- **updateRentToRented()**: Main function to update rent status
- **getRentById()**: Helper function to fetch rent data
- Handles API calls and error management
- Returns structured response objects

### 4. React Component (`components/Rent/RentStatusUpdate.tsx`)

- Form component for updating rent status
- Input fields for `endStationId` and `endDate`
- Loading states and error handling
- Toast notifications for user feedback

### 5. Demo Page (`app/rent-management/page.tsx`)

- Complete example implementation
- Lists all rents with "renting" status
- Interactive selection and update workflow
- Real-time data refresh after updates

## Usage Examples

### Basic API Usage

```javascript
// Update rent status
const response = await fetch("/api/rent/rentId123", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rentId: "rentId123",
    endStationId: "STATION_001",
    endDate: new Date(),
  }),
});
```

### Using the Utility Function

```javascript
import { updateRentToRented } from "@/utils/rentService";

const result = await updateRentToRented("rentId123", "STATION_001", new Date());

if (result.success) {
  console.log("Rent updated successfully:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Using the React Component

```jsx
import RentStatusUpdate from "@/components/Rent/RentStatusUpdate";

<RentStatusUpdate
  rentId="rentId123"
  onSuccess={() => console.log("Updated!")}
/>;
```

## Function Parameters

The main function requires:

- **rentId** (string): The ID of the rent to update
- **endStationId** (string): The station ID where the rent ended
- **endDate** (Date): The end date and time

## Features

- ✅ Validates rent exists and is in "renting" status
- ✅ Automatically calculates usage duration
- ✅ Updates multiple fields: `endStationId`, `endDate`, `status`, `usageDuration`, `updatedAt`
- ✅ Comprehensive error handling
- ✅ TypeScript support with proper type definitions
- ✅ React component with form validation
- ✅ Toast notifications for user feedback
- ✅ Real-time data refresh

## Error Handling

The function handles various error scenarios:

- Missing required parameters
- Rent not found
- Rent not in "renting" status
- Network errors
- Server errors

All errors are returned in a structured format for easy handling.
