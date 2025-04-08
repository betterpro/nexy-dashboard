"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

// Dynamically import ApexCharts with no SSR
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[355px] items-center justify-center">
      <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

const chartOptions = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
    markers: {
      width: 12,
      height: 12,
    },
    itemMargin: {
      horizontal: 15,
      vertical: 5,
    },
  },
  colors: ["#3C50E0", "#80CAEE"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 335,
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#623CEA14",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
  stroke: {
    width: [2, 2],
    curve: "smooth",
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: "#fff",
    strokeColors: ["#3056D3", "#80CAEE"],
    strokeWidth: 3,
    hover: {
      size: 6,
    },
  },
  xaxis: {
    type: "category",
    categories: [],
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        colors: "#64748b",
        fontSize: "12px",
        fontFamily: "Satoshi, sans-serif",
      },
    },
  },
  yaxis: {
    title: {
      style: {
        fontSize: "0px",
      },
    },
    min: 0,
    labels: {
      formatter: function (val) {
        return Math.round(val);
      },
      style: {
        colors: "#64748b",
        fontSize: "12px",
        fontFamily: "Satoshi, sans-serif",
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: function (val) {
        return Math.round(val);
      },
    },
  },
};

const ReportChart = ({ chartData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="flex h-[355px] items-center justify-center">
          <Icon
            icon="mdi:loading"
            className="w-8 h-8 animate-spin text-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div>
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Rental Analytics
        </h3>
      </div>

      <div className="mb-2">
        <div id="chartOne" className="-ml-5 h-[355px] w-[105%]">
          <ReactApexChart
            options={{
              ...chartOptions,
              xaxis: {
                ...chartOptions.xaxis,
                categories: chartData.categories,
              },
            }}
            series={chartData.series}
            type="area"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportChart;
