import { getBatteryStatus } from "./batteryStatus";
import { collection, addDoc } from "firebase/firestore";
import { DB } from "@/firebase";

function getDayField(dayIndex) {
  const days = {
    0: "suStart", // Sunday
    1: "moStart", // Monday
    2: "tuStart", // Tuesday
    3: "weStart", // Wednesday
    4: "thStart", // Thursday
    5: "frStart", // Friday
    6: "saStart", // Saturday
  };
  return days[dayIndex];
}

function getDayEndField(dayIndex) {
  const days = {
    0: "suEnd", // Sunday
    1: "moEnd", // Monday
    2: "tuEnd", // Tuesday
    3: "weEnd", // Wednesday
    4: "thEnd", // Thursday
    5: "frEnd", // Friday
    6: "saEnd", // Saturday
  };
  return days[dayIndex];
}

function isWithinOperatingHours(station, currentTime = new Date()) {
  // Get current time in the station's timezone
  const stationTime = new Date(
    currentTime.toLocaleString("en-US", {
      timeZone: station.timezone || "America/Vancouver",
    })
  );

  // Get the day of the week (0-6, where 0 is Sunday)
  const dayOfWeek = stationTime.getDay();

  // Get the start and end fields for the current day
  const startField = getDayField(dayOfWeek);
  const endField = getDayEndField(dayOfWeek);

  // Get hours in 24-hour format
  const currentHour = stationTime.getHours();

  // Use day-specific operating hours or default to 8 AM to 8 PM
  const openingHour = station[startField] || 8;
  const closingHour = station[endField] || 20;

  return currentHour >= openingHour && currentHour < closingHour;
}

function getOperatingHoursText(station) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days
    .map((day) => {
      const shortDay = day.substring(0, 2).toLowerCase();
      const start = station[`${shortDay}Start`] || 8;
      const end = station[`${shortDay}End`] || 20;
      return `${day}: ${start}:00 - ${end}:00`;
    })
    .join("<br>");
}

export async function checkStationsAndNotify(stations) {
  const offlineStations = [];
  const errors = [];
  const currentTime = new Date();

  for (const station of stations) {
    try {
      // Skip checking if station is not within operating hours
      if (!isWithinOperatingHours(station, currentTime)) {
        continue;
      }

      const { batteries } = await getBatteryStatus(station.stationId);

      // If no batteries returned, consider the station offline
      if (!batteries || batteries.length === 0) {
        offlineStations.push({
          stationId: station.stationId,
          stationTitle: station.stationTitle,
          type:
            station.stationId.startsWith("ZAPP") ||
            station.stationId.startsWith("WSEP")
              ? "ZAPP"
              : "NEXY",
          startDate: station.startDate,
          timezone: station.timezone || "America/Vancouver",
          operatingHours: {
            moStart: station.moStart || 8,
            moEnd: station.moEnd || 20,
            tuStart: station.tuStart || 8,
            tuEnd: station.tuEnd || 20,
            weStart: station.weStart || 8,
            weEnd: station.weEnd || 20,
            thStart: station.thStart || 8,
            thEnd: station.thEnd || 20,
            frStart: station.frStart || 8,
            frEnd: station.frEnd || 20,
            saStart: station.saStart || 8,
            saEnd: station.saEnd || 20,
            suStart: station.suStart || 8,
            suEnd: station.suEnd || 20,
          },
          lastChecked: currentTime.toISOString(),
        });
      }
    } catch (error) {
      errors.push({
        stationId: station.stationId,
        error: error.message,
        startDate: station.startDate,
        timezone: station.timezone || "America/Vancouver",
        operatingHours: {
          moStart: station.moStart || 8,
          moEnd: station.moEnd || 20,
          tuStart: station.tuStart || 8,
          tuEnd: station.tuEnd || 20,
          weStart: station.weStart || 8,
          weEnd: station.weEnd || 20,
          thStart: station.thStart || 8,
          thEnd: station.thEnd || 20,
          frStart: station.frStart || 8,
          frEnd: station.frEnd || 20,
          saStart: station.saStart || 8,
          saEnd: station.saEnd || 20,
          suStart: station.suStart || 8,
          suEnd: station.suEnd || 20,
        },
        lastChecked: currentTime.toISOString(),
      });
    }
  }

  // If there are offline stations, create a notification document
  if (offlineStations.length > 0) {
    await addDoc(collection(DB, "mail"), {
      to: "reza@nexy.ca",
      subject: "Offline Stations",
      html: `
        <p>The following stations are offline during their operating hours:</p>
        <ul>
          ${offlineStations
            .map((station) => {
              const localTime = new Date().toLocaleString("en-US", {
                timeZone: station.timezone,
              });
              return `
                  <li>
                    ${station.stationTitle} (${station.stationId}) - ${
                station.type
              }
                    <br>
                    Start Date: ${new Date(station.startDate).toLocaleString()}
                    <br>
                    Local Time: ${localTime}
                    <br>
                    Operating Hours:<br>
                    ${getOperatingHoursText(station.operatingHours)}
                    <br>
                    Timezone: ${station.timezone}
                    <br>
                    Last Checked: ${new Date(
                      station.lastChecked
                    ).toLocaleString()}
                  </li>
                `;
            })
            .join("")}
        </ul>
        ${
          errors.length > 0
            ? `
          <p>Errors encountered:</p>
          <ul>
            ${errors
              .map((error) => {
                const localTime = new Date().toLocaleString("en-US", {
                  timeZone: error.timezone,
                });
                return `
                    <li>
                      ${error.stationId}: ${error.error}
                      <br>
                      Start Date: ${new Date(error.startDate).toLocaleString()}
                      <br>
                      Local Time: ${localTime}
                      <br>
                      Operating Hours:<br>
                      ${getOperatingHoursText(error.operatingHours)}
                      <br>
                      Timezone: ${error.timezone}
                      <br>
                      Last Checked: ${new Date(
                        error.lastChecked
                      ).toLocaleString()}
                    </li>
                  `;
              })
              .join("")}
          </ul>
        `
            : ""
        }
      `,
    });
  }

  return {
    offlineStations,
    errors,
  };
}
