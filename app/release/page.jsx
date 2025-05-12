"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { DB } from "@/firebase";
import { toast } from "react-toastify";
import { useAuth } from "@/components/context/AuthContext";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import axios from "axios";

function ReleasePowerBankPage() {
  const { user, userRole } = useAuth();
  const [stations, setStations] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      let q;
      if (userRole === ROLES.FRANCHISEE) {
        q = query(collection(DB, "stations"), where("franchiseeId", "==", user?.franchiseeId));
      } else {
        q = query(collection(DB, "stations"));
      }
      const snap = await getDocs(q);
      setStations(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStations();
  }, [userRole, user?.franchiseeId]);

  useEffect(() => {
    if (!selectedStation) {
      setBatteries([]);
      setSelectedBattery(null);
      return;
    }
    const fetchBatteries = async () => {
      try {
        const res = await fetch(`/api/battery/status?stationId=${encodeURIComponent(selectedStation)}`);
        if (!res.ok) {
           throw new Error("Failed to fetch battery status");
        }
        const { batteries: batteryData } = await res.json();
        console.log(batteryData)
        setBatteries(batteryData);
       
      } catch (err) {
         console.error("Error fetching battery status:", err);
         toast.error("Failed to fetch battery status");
         setBatteries([]);
      }
    };
    fetchBatteries();
  }, [selectedStation]);

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!selectedStation || !selectedBattery) {
      toast.error("Please fill all fields");
      return;
    }
const getAuthHeader = () => {
  const username = "ec0f42a52f81ac228c673ed51d0f0421";
  const password = "";
  const base64Credentials = btoa(`${username}:${password}`);
  return {
    Authorization: `Basic ${base64Credentials}`,
  };
};
    setLoading(true);
    console.log(selectedStation, selectedBattery.slot_id, selectedBattery);
    try {
      if (selectedStation.startsWith("ZAPP")) {
        // Call the ZAPP API
        const response = await axios.post(
          `http://15.223.4.61:17990/v1/station/${selectedStation}?battery_id=${selectedBattery.battery_id}&slot_id=${selectedBattery.slot_id}`,
          null,
          {
            headers: (0, getAuthHeader)(),
          }
        );
        return response.data; // Return response data
      } else if (selectedStation.startsWith("NEXY")) {
        console.log(
          "Nexy",
          selectedBattery.slot_id,
          selectedStation,
          `https://powerbank.cnwoshi.com/DeviceReceive/receive?E=${selectedStation}&I=65&token=kttHZeNEfo@JkSe7UjIJzjskYK^A3uTC&L=${selectedBattery.slot_id}`
        );
        // Call the NEXY API
        const nexyUrl = `https://powerbank.cnwoshi.com/DeviceReceive/receive?E=${selectedStation}&I=65&token=kttHZeNEfo@JkSe7UjIJzjskYK^A3uTC&L=${selectedBattery.slot_id}`;
        const response = await axios.post(nexyUrl, null);
        return response.data; // Return response data
      } else {
        throw new Error("Invalid stationId prefix");
      }
    } catch (err) {
      toast.error("Failed to release power bank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-boxdark rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Release Power Bank
      </h1>
      <form onSubmit={handleRelease} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Station</label>
          <select
            className="w-full border rounded px-3 py-2 dark:bg-meta-4 dark:text-white"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            required
          >
            <option value="">Select station</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Battery</label>
          <select
            className="w-full border rounded px-3 py-2 dark:bg-meta-4 dark:text-white"
            value={selectedBattery ? selectedBattery.battery_id : ""}
            onChange={(e) => {
              const batteryId = e.target.value;
              const battery = batteries.find(b => b.battery_id === batteryId);
              setSelectedBattery(battery);
            }}
            required
            disabled={!selectedStation}
          >
            <option value="">Select battery</option>
            {batteries.map((b) => (
              <option key={b.battery_id} value={b.battery_id}>
                {b.slot_id} - {b.battery_capacity}%
              </option>
            ))}
          </select>
        </div>
       
        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Releasing..." : "Release Power Bank"}
        </button>
      </form>
    </div>
  );
}

export default withRoleAuth(ReleasePowerBankPage, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER]); 