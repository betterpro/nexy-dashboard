# Firestore Indexes Required

## Archive Rents Feature

The archive rents feature filters archived rents in the application code, so **no additional Firestore indexes are required** beyond the standard ones for ordering by `startDate`.

### How It Works

The application:

1. Fetches all rents matching the query (status, stationId, etc.)
2. Filters out archived rents in JavaScript: `.filter((rent) => !rent.archived)`
3. Displays only non-archived rents

This approach works seamlessly with existing rents that don't have the `archived` field, as they are treated as non-archived by default.

### Standard Indexes (May Already Exist)

You may need these standard indexes if not already created:

#### 1. Rents Collection - By Start Date

- **Collection**: `rents`
- **Fields**:
  - `startDate` (Descending)
- **Query scope**: Collection

#### 2. Rents Collection - By Status

- **Collection**: `rents`
- **Fields**:
  - `status` (Ascending)
  - `startDate` (Descending)
- **Query scope**: Collection

#### 3. Rents Collection - By Station

- **Collection**: `rents`
- **Fields**:
  - `startStationId` (Ascending)
  - `startDate` (Descending)
- **Query scope**: Collection

### How to Create Indexes (If Needed)

**Option 1: Automatic (Recommended)**

1. Use the feature that triggers the query
2. If an index is missing, Firestore will display an error with a link
3. Click the link and confirm the index creation
4. Wait 1-5 minutes for the index to build

**Option 2: Manual**

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Enter the collection name and fields as specified above
4. Click "Create"

### Note

- Archived rents have `archived: true` in their document
- Rents without the `archived` field are considered non-archived
- Filtering in the application code eliminates the need for complex composite indexes
- The archive feature works immediately without waiting for index creation
