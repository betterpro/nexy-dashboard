import Moment from "react-moment";
import { Icon } from "@iconify/react";
import moment from "moment-timezone";

const TableList = ({ dataTable, totalRevenue, stationTitle }) => {
  function ConvertMinutesToHoursAndMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return minutes ? `${hours > 0 ? `${hours}h ` : ""}${mins}m` : "";
  }

  // Get user's timezone
  const userTimezone = moment.tz.guess();

  return (
    <div>
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-black dark:text-white">
          {stationTitle || "Station Report"}
        </h4>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Icon
            icon="material-symbols-light:payments"
            className="text-primary"
            width={20}
          />
          <span className="font-medium text-primary">
            ${totalRevenue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Table Section */}
      {dataTable && dataTable.length > 0 ? (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4">
              <div className="p-2">
                <h5 className="text-xs font-medium uppercase">Start Date</h5>
              </div>
              <div className="p-2 text-center">
                <h5 className="text-xs font-medium uppercase">End Date</h5>
              </div>
              <div className="p-2 text-center">
                <h5 className="text-xs font-medium uppercase">Duration</h5>
              </div>
              <div className="p-2 text-center">
                <h5 className="text-xs font-medium uppercase">Revenue</h5>
              </div>
            </div>

            {/* Table Body */}
            {dataTable.map((rent, key) => (
              <div
                className={`grid grid-cols-4 ${
                  key === dataTable.length - 1
                    ? ""
                    : "border-b border-stroke dark:border-strokedark"
                }`}
                key={key}
              >
                <div className="p-2">
                  <div className="flex flex-col">
                    <p className="text-sm text-black dark:text-white">
                      <Moment format="DD MMM YYYY" tz={userTimezone}>
                        {rent.startDate?.seconds * 1000}
                      </Moment>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <Moment format="HH:mm" tz={userTimezone}>
                        {rent.startDate?.seconds * 1000}
                      </Moment>
                    </p>
                  </div>
                </div>

                <div className="p-2 text-center">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-black dark:text-white">
                      <Moment format="DD MMM YYYY" tz={userTimezone}>
                        {rent.endDate?.seconds * 1000}
                      </Moment>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <Moment format="HH:mm" tz={userTimezone}>
                        {rent.endDate?.seconds * 1000}
                      </Moment>
                    </p>
                  </div>
                </div>

                <div className="p-2 text-center">
                  <span className="text-sm text-meta-1">
                    {ConvertMinutesToHoursAndMinutes(rent.usageDuration)}
                  </span>
                </div>

                <div className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Icon
                      icon="material-symbols-light:payments"
                      className="text-meta-3"
                      width={16}
                    />
                    <p className="text-sm text-meta-3">
                      ${(rent.totalPayment / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-stroke bg-white p-8 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
          <Icon
            icon="material-symbols-light:data-object"
            className="mx-auto mb-4 text-gray-400"
            width={48}
          />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            No rental data available
          </h3>
        </div>
      )}
    </div>
  );
};

export default TableList;
