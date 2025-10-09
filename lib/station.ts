// Station domain types shared across client and server.
// Uses type-only unions to support both firebase client and admin SDKs.

export type FirestoreTimestamp =
  | Date
  | import("firebase/firestore").Timestamp
  | import("firebase-admin").firestore.Timestamp;

export type FirestoreGeoPoint =
  | { latitude: number; longitude: number }
  | import("firebase/firestore").GeoPoint
  | import("firebase-admin").firestore.GeoPoint;

export interface StationPricing {
  currency: string;
  dailyLimitAmount?: number;
  dailyLimitPeriods?: number;
  dailyLimitResetTime?: string; // e.g., "00:00:00"
  damageFee?: number;
  depositAmount?: number;
  depositRefundable?: boolean;
  depositRequired?: boolean;
  freePeriodMinutes?: number;
  freePeriodRequiresPreAuth?: boolean;
  freeTimeMinutes?: number;
  hasDailyLimit?: boolean;
  hasDiscounts?: boolean;
  hasFreePeriod?: boolean;
  lateReturnFee?: number;
  lostBatteryFee?: number;
  minimumRentalMinutes?: number;
  preAuthAmount?: number;
  pricePerHour?: number;
  pricePerPeriod?: number;
  pricePeriod?: string; // e.g., "hour"
  pricePeriodDuration?: number; // e.g., 1
  requiresPreAuth?: boolean;
  returnDurationLimitHours?: number;
  taxIncluded?: boolean;
  taxRate?: number; // percentage, e.g., 5
}

export interface Station {
  // Identifiers
  id: string; // Firestore doc id or provided id
  stationId?: string; // Sometimes duplicated id field

  // Core info
  name?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  tags?: string[];

  // Contact / social
  email?: string;
  phone?: string;
  tel?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;

  // Locale / timezone
  locale?: string; // e.g., "en-CA"
  timezone?: string; // e.g., "America/Vancouver"
  hours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
  private?: boolean;
  active?: boolean;

  // Address / location
  address?: string;
  location?: FirestoreGeoPoint;
  lat?: number; // derived helper
  lng?: number; // derived helper

  // Media
  logo?: string; // URL
  images?: string[]; // URLs

  // Operational counts and settings
  currency?: string; // base currency string, e.g., "CAD"
  slots?: number;
  powerBank?: number;
  parking?: number;
  price?: number;

  // Relationships
  agreementId?: string | null;
  franchiseeId?: string | null;
  partnerId?: string | null;
  partnerInfo?: Record<string, unknown> | null;
  revenueShare?: number | null;

  // External refs
  googlePlaceId?: string;
  googlePlace?: Record<string, unknown>;

  // Timestamps
  createDate?: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;

  // Pricing
  pricing?: StationPricing;
}

// No default export to avoid conflicts in JS imports
