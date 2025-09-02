"use client";
import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { DB } from "@/firebase";
import TableList from "./Table";
import { ROLES } from "@/components/context/roles";
import { useAuth } from "@/components/context/AuthContext";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import ReportChart from "./Chart";
import moment from "moment-timezone";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function NexyDashboard() {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [rents, setRents] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const [chartData, setChartData] = useState({
    series: [],
    categories: [],
    totalRevenue: 0,
    revenuePerMonth: {},
  });

  // Fetch Stations Collection from Firestore
  useEffect(() => {
    // Don't fetch stations if user is not loaded yet
    if (!user || !userRole) {
      return;
    }

    let stationsQuery;

    if (userRole === ROLES.SUPER_ADMIN) {
      stationsQuery = query(collection(DB, "stations"));
    } else if (userRole === ROLES.FRANCHISEE) {
      // Check if franchiseeId exists and is not undefined
      if (!user?.franchiseeId) {
        console.error("Franchisee user missing franchiseeId:", user);
        setStations([]);
        setLoading(false);
        return;
      }

      stationsQuery = query(
        collection(DB, "stations"),
        where("franchiseeId", "==", user.franchiseeId)
      );
    }

    const fetchStations = async () => {
      try {
        setLoading(true);

        // Ensure we have a valid query before proceeding
        if (!stationsQuery) {
          console.error("No valid query constructed for user role:", userRole);
          setStations([]);
          setLoading(false);
          return;
        }

        const stationSnapshot = await getDocs(stationsQuery);
        const stationList = stationSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStations(stationList);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [userRole, user?.uid, user?.franchiseeId]);

  // Fetch Rents Collection based on Selected Station ID
  const fetchRents = useCallback(async () => {
    try {
      setLoading(true);
      const rentsCollection = collection(DB, "rents");
      const rentsQuery = query(
        rentsCollection,
        where("startStationId", "==", selectedStationId)
      );
      const rentsSnapshot = await getDocs(rentsQuery);

      let totalRevenuecont = 0;
      const rentsList = rentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        totalRevenuecont += data.totalPayment ?? 0;
        return {
          id: doc.id,
          ...data,
        };
      });

      setRents(rentsList);
      setTotalRevenue(totalRevenuecont);
    } catch (error) {
      console.error("Error fetching rents:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStationId]);

  useEffect(() => {
    if (!selectedStationId) return;
    fetchRents();
  }, [selectedStationId]);

  // Filter stations based on search term
  const filteredStations = stations.filter(
    (station) =>
      station.stationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalRents = rents.length;
  const averageDuration =
    rents.reduce((acc, rent) => acc + (rent.usageDuration || 0), 0) /
      totalRents || 0;
  const uniqueReturnStations = new Set(rents.map((rent) => rent.endStationId))
    .size;

  // Calculate additional metrics
  const totalRevenueInDollars = (totalRevenue / 100).toFixed(2);
  const averageRevenuePerRent =
    totalRents > 0 ? (totalRevenue / totalRents / 100).toFixed(2) : "0.00";
  const returnRate =
    totalRents > 0
      ? ((uniqueReturnStations / totalRents) * 100).toFixed(1)
      : "0.0";

  // Format duration display
  const formatDuration = (minutes) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.round(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days} days`);
    if (hours > 0) parts.push(`${hours} hours`);
    if (mins > 0) parts.push(`${mins} mins`);

    return parts.length > 0 ? parts.join(", ") : "0 mins";
  };

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    try {
      const rentsCollection = collection(DB, "rents");
      const rentsQuery = query(
        rentsCollection,
        where("startStationId", "==", selectedStationId)
      );
      const rentsSnapshot = await getDocs(rentsQuery);

      let monthlyRevenue = {};
      let monthlyRents = {};

      // Get current date and date 12 months ago in user's timezone
      const currentDate = moment().tz(moment.tz.guess());
      const twelveMonthsAgo = moment()
        .tz(moment.tz.guess())
        .subtract(12, "months");

      // Initialize all months in the last 12 months with 0
      for (let i = 0; i < 12; i++) {
        const date = moment().tz(moment.tz.guess()).subtract(i, "months");
        const monthKey = `${date.format("YYYY-MM")}`;
        monthlyRevenue[monthKey] = 0;
        monthlyRents[monthKey] = 0;
      }

      // Process all rents data
      rentsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const rentDate = moment(data.startDate.seconds * 1000).tz(
          moment.tz.guess()
        );

        // Only process data from the last 12 months
        if (rentDate.isSameOrAfter(twelveMonthsAgo)) {
          const monthKey = rentDate.format("YYYY-MM");
          monthlyRevenue[monthKey] += data.totalPayment / 100 || 0;
          monthlyRents[monthKey] += 1;
        }
      });

      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyRevenue).sort();

      setChartData({
        series: [
          {
            name: "Revenue",
            data: sortedMonths.map((monthKey) => monthlyRevenue[monthKey]),
          },
          {
            name: "Number of Rentals",
            data: sortedMonths.map((monthKey) => monthlyRents[monthKey]),
          },
        ],
        categories: sortedMonths,
        totalRevenue: totalRevenue,
        revenuePerMonth: monthlyRevenue,
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  }, [selectedStationId, totalRevenue]);

  useEffect(() => {
    if (selectedStationId) {
      fetchChartData();
    }
  }, [selectedStationId]);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Report" />

      {selectedStationId && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Revenue Performance Card */}
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <Icon
                  icon="material-symbols-light:payments"
                  className="fill-primary dark:fill-white"
                  width={24}
                />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    ${totalRevenueInDollars}
                  </h4>
                  <span className="text-sm font-medium">Total Revenue</span>
                  <p className="mt-1 text-xs text-meta-3">
                    ${averageRevenuePerRent} per rental
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Activity Card */}
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <Icon
                  icon="material-symbols-light:local-taxi"
                  className="fill-primary dark:fill-white"
                  width={24}
                />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {totalRents}
                  </h4>
                  <span className="text-sm font-medium">Total Rentals</span>
                  <p className="mt-1 text-xs text-meta-3">
                    {returnRate}% return rate
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Pattern Card */}
            <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <Icon
                  icon="material-symbols-light:timer"
                  className="fill-primary dark:fill-white"
                  width={24}
                />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {formatDuration(averageDuration)}
                  </h4>
                  <span className="text-sm font-medium">Avg. Usage Time</span>
                  <p className="mt-1 text-xs text-meta-3">
                    {uniqueReturnStations} return stations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mt-6">
            {loading ? (
              <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                <div className="flex h-[355px] items-center justify-center">
                  <Icon
                    icon="mdi:loading"
                    className="w-8 h-8 animate-spin text-primary"
                  />
                </div>
              </div>
            ) : (
              <ReportChart chartData={chartData} isLoading={loading} />
            )}
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Station Selection Card */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Select Station
            </h4>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <Icon icon="material-symbols-light:search" width={20} />
              </span>
              <input
                type="text"
                placeholder="Search by station name or ID..."
                className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Station List */}
          <div className="max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {filteredStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStationId(station.id)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-gray-2 dark:hover:bg-meta-4 ${
                    selectedStationId === station.id
                      ? "border-primary bg-primary/5"
                      : "border-stroke dark:border-strokedark"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        station.logo !== ""
                          ? station.logo
                          : "/images/favicon.ico"
                      }
                      className="rounded-full h-10 w-10"
                      alt={`${station.stationTitle} logo`}
                    />
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {station.stationTitle}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {station.id}
                      </p>
                    </div>
                  </div>
                  {selectedStationId === station.id && (
                    <Icon
                      icon="material-symbols-light:check-circle"
                      className="text-primary"
                      width={24}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Table */}
        {selectedStationId && (
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
            ) : rents.length > 0 ? (
              <TableList
                dataTable={rents.filter((r) => r.usageDuration > 0)}
                totalRevenue={totalRevenue / 100}
                stationTitle={
                  stations.find((s) => s.id === selectedStationId)?.stationTitle
                }
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <div className="text-center">
                  <Icon
                    icon="material-symbols-light:data-object"
                    className="mx-auto mb-4 text-gray-400"
                    width={48}
                  />
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                    No Rents Found for the Selected Station
                  </h3>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NexyDashboard;
