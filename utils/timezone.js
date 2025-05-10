import { formatInTimeZone, zonedTimeToUtc, toZonedTime } from 'date-fns-tz';
import { zones } from 'tzdata';

// Get all timezones and format them for display
export const timeZones = Object.keys(zones)
  .filter(zone => zone && typeof zone === 'string') // Filter out invalid timezones
  .map(zone => {
    try {
      const now = new Date();
      const offset = formatInTimeZone(now, zone, 'xxx'); // Format like "+07:00"
      const city = zone.split('/').pop().replace(/_/g, ' ');
      return {
        value: zone,
        label: `(GMT${offset}) ${city}`,
        offset
      };
    } catch (error) {
      console.warn(`Invalid timezone: ${zone}`, error);
      return null;
    }
  })
  .filter(Boolean) // Remove any null entries from failed timezone formatting
  .sort((a, b) => {
    // Sort by offset first
    const offsetA = parseInt(a.offset.replace(':', ''));
    const offsetB = parseInt(b.offset.replace(':', ''));
    if (offsetA !== offsetB) return offsetA - offsetB;
    // Then by city name
    return a.label.localeCompare(b.label);
  });

// Get timezones for a specific region
export const getTimezonesByRegion = (region) => {
  return timeZones.filter(zone => zone.value.startsWith(region));
};

// Get timezones for a specific country
export const getTimezonesByCountry = (countryCode) => {
  const countryZones = {
    'CA': ['America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Toronto', 'America/Halifax', 'America/St_Johns'],
    'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
    // Add more countries as needed
  };
  return timeZones.filter(zone => countryZones[countryCode]?.includes(zone.value));
};

// Format a date in a specific timezone
export const formatInTimezone = (date, timezone, format = 'yyyy-MM-dd HH:mm:ss') => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    return formatInTimeZone(date, safeTimezone, format);
  } catch (error) {
    console.warn(`Error formatting date in timezone ${timezone}:`, error);
    return formatInTimeZone(date, 'America/Vancouver', format);
  }
};

// Convert a local time to UTC
export const localToUTC = (date, timezone) => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    return zonedTimeToUtc(date, safeTimezone);
  } catch (error) {
    console.warn(`Error converting to UTC for timezone ${timezone}:`, error);
    return zonedTimeToUtc(date, 'America/Vancouver');
  }
};

// Convert UTC to local time
export const utcToLocal = (date, timezone) => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    return toZonedTime(date, safeTimezone);
  } catch (error) {
    console.warn(`Error converting from UTC for timezone ${timezone}:`, error);
    return toZonedTime(date, 'America/Vancouver');
  }
};

// Parse time string in HH:mm format to hours
const parseTimeString = (timeStr) => {
  if (!timeStr || timeStr === '') return null; // Return null for empty strings
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60); // Convert to decimal hours for more precise comparison
  } catch (error) {
    console.warn(`Error parsing time string ${timeStr}:`, error);
    return null; // Return null on error
  }
};

// Check if a time is within operating hours for a specific timezone
export const isWithinOperatingHours = (date, timezone, startTime, endTime) => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    const localTime = utcToLocal(date, safeTimezone);
    const currentHour = localTime.getHours() + (localTime.getMinutes() / 60); // Convert to decimal hours
    const startHour = parseTimeString(startTime);
    const endHour = parseTimeString(endTime);

    // If either start or end time is null (empty string), the station is closed
    if (startHour === null || endHour === null) {
      return false;
    }

    // Handle hours that span across midnight
    if (endHour < startHour) {
      // If current time is before midnight, check if it's after start time
      // If current time is after midnight, check if it's before end time
      return currentHour >= startHour || currentHour < endHour;
    }
    
    // Normal case (same day)
    return currentHour >= startHour && currentHour < endHour;
  } catch (error) {
    console.warn(`Error checking operating hours for timezone ${timezone}:`, error);
    return false;
  }
};

// Get current time in a specific timezone
export const getCurrentTimeInTimezone = (timezone) => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    return utcToLocal(new Date(), safeTimezone);
  } catch (error) {
    console.warn(`Error getting current time for timezone ${timezone}:`, error);
    return utcToLocal(new Date(), 'America/Vancouver');
  }
};

// Format operating hours for display
export const formatOperatingHours = (startTime, endTime) => {
  try {
    // If either time is empty, return "Closed"
    if (!startTime || !endTime || startTime === '' || endTime === '') {
      return 'Closed';
    }

    const formatTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const startHour = parseTimeString(startTime);
    const endHour = parseTimeString(endTime);

    // If either time is null, return "Closed"
    if (startHour === null || endHour === null) {
      return 'Closed Today';
    }

    // If end time is less than start time, it means it's the next day
    if (endHour < startHour) {
      return `${formatTime(startTime)} - ${formatTime(endTime)} (Next Day)`;
    }

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  } catch (error) {
    console.warn(`Error formatting operating hours:`, error);
    return 'Closed'; // Return "Closed" on error
  }
};

// Get day of week in a specific timezone
export const getDayOfWeekInTimezone = (date, timezone) => {
  try {
    const safeTimezone = timezone || 'America/Vancouver';
    const localDate = utcToLocal(date, safeTimezone);
    return localDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  } catch (error) {
    console.warn(`Error getting day of week for timezone ${timezone}:`, error);
    return new Date().getDay();
  }
};

// Check if a station is currently open based on its operating hours
export const isStationOpen = (station) => {
  try {
    const now = new Date();
    const timezone = station?.timezone || 'America/Vancouver';
    const dayOfWeek = getDayOfWeekInTimezone(now, timezone);
    
    // Map day index to day code
    const dayMap = {
      0: 'su',
      1: 'mo',
      2: 'tu',
      3: 'we',
      4: 'th',
      5: 'fr',
      6: 'sa'
    };
    
    const dayCode = dayMap[dayOfWeek];
    const startTime = station?.[`${dayCode}Start`];
    const endTime = station?.[`${dayCode}End`];
    
    // If either time is empty or undefined, the station is closed
    if (!startTime || !endTime || startTime === '' || endTime === '') {
      return false;
    }
    
    return isWithinOperatingHours(now, timezone, startTime, endTime);
  } catch (error) {
    console.warn('Error checking if station is open:', error);
    return false;
  }
}; 