import { Timestamp } from "firebase/firestore";

export type Rent = {
  id: string;
  customerId: string;
  startStationId: string;
  endStationId?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  usageDuration?: number; // in minutes
  totalPayment?: number; // in cents
  status: "renting" | "rented" | "paid" | "in_progress" | "cancelled";
  batteryId?: string;
  returnData?: {
    imei?: string;
    [key: string]: any;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  archived?: boolean; // For archiving old rents
  archivedAt?: Date;
};

export type RentUpdateData = {
  endStationId: string;
  endDate: Timestamp;
  status: "rented";
  usageDuration?: number;
  updatedAt?: Timestamp;
};
