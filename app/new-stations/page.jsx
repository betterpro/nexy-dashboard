"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { DB } from "@/firebase";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";

const NewStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const { user, userRole, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't fetch stations if user is not loaded yet or if still loading
    if (authLoading || !user || !user.role) {
      return;
    }

    const fetchStations = async () => {
      try {
        setLoading(true);
        let stationsQuery;

        if (user.role === "superadmin") {
          stationsQuery = query(collection(DB, "Stations"));
        } else if (user.role === "franchisee") {
          if (!user?.franchiseeId) {
            console.error("Franchisee user missing franchiseeId:", user);
            setStations([]);
            setLoading(false);
            return;
          }

          stationsQuery = query(
            collection(DB, "Stations"),
            where("franchiseeId", "==", user.franchiseeId)
          );
        }

        if (!stationsQuery) {
          console.error("No valid query constructed for user role:", user.role);
          setStations([]);
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(stationsQuery);
        const stationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStations(stationsData);
      } catch (error) {
        console.error("Error fetching stations:", error);
        toast.error("Failed to fetch stations");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [userRole, user?.uid, authLoading]);

  const handleAddStation = async (stationData) => {
    try {
      // Validate required fields
      if (!stationData.stationId || !stationData.name || !stationData.mac) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate MAC address format (12 hex characters without separators)
      const macRegex = /^[0-9A-Fa-f]{12}$/;
      if (!macRegex.test(stationData.mac)) {
        toast.error(
          "Please enter a valid MAC address format (e.g., 9803cfc176be)"
        );
        return;
      }

      // Check if station ID already exists
      const existingStations = stations.filter(
        (station) =>
          station.stationId === stationData.stationId ||
          station.id === stationData.stationId
      );
      if (existingStations.length > 0) {
        toast.error("A station with this ID already exists");
        return;
      }

      const newStation = {
        ...stationData,
        batteryCount: parseInt(stationData.batteryCount) || 0,
        price: parseFloat(stationData.price) || 0,
        lastConnected: serverTimestamp(),
        lastDisconnected: serverTimestamp(),
        lastHeartbeat: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        inventory: null,
        layout_json: {
          bottom: {
            height: 20,
            assets: [
              {
                duration: 5,
                link: "",
                type: "image",
              },
            ],
          },
          top: {
            height: 80,
            assets: [
              {
                duration: 5,
                link: "",
                type: "image",
              },
            ],
          },
          layout_size: {
            height: 1280,
            width: 800,
          },
        },
        qrcode: {
          baseurl: "https://app.nexy.ca/",
          generate: true,
          height: 150,
          width: 150,
          x: 300,
          y: 1000,
        },
        release_dialog: {
          backgroundColor: "#CC001A57",
          duration: 5,
          icon: "",
          subtitle: "Have a safe ride!",
          subtitleObj: {
            sizeSp: 14,
          },
          title: "Battery Released",
          titleObj: {
            bold: true,
            sizeSp: 24,
          },
        },
        return_dialog: {
          backgroundColor: "#CC101010",
          backgroundImage: "",
          duration: 6,
          gravity: "center",
          icon: {
            sizeDp: 96,
            url: "",
            visible: true,
            paddingDp: 24,
          },
          subtitle: "Thank you!",
          subtitleObj: {
            color: "#DDDDDD",
            sizeSp: 26,
          },
          title: "Battery Returned",
          titleObj: {
            bold: true,
            color: "#FFFFFF",
            sizeSp: 26,
          },
        },
        role: "franchisee",
        status: "online",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(DB, "Stations"), newStation);
      toast.success("Station added successfully!");
      setShowAddForm(false);

      // Refresh the stations list
      const querySnapshot = await getDocs(query(collection(DB, "Stations")));
      const stationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStations(stationsData);
    } catch (error) {
      console.error("Error adding station:", error);
      toast.error("Failed to add station");
    }
  };

  const handleEditStation = async (stationId, updatedData) => {
    try {
      // Validate required fields
      if (!updatedData.stationId || !updatedData.name || !updatedData.mac) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate MAC address format (12 hex characters without separators)
      const macRegex = /^[0-9A-Fa-f]{12}$/;
      if (!macRegex.test(updatedData.mac)) {
        toast.error(
          "Please enter a valid MAC address format (e.g., 9803cfc176be)"
        );
        return;
      }

      // Check if station ID already exists (excluding current station)
      const existingStations = stations.filter(
        (station) =>
          (station.stationId === updatedData.stationId ||
            station.id === updatedData.stationId) &&
          station.id !== stationId
      );
      if (existingStations.length > 0) {
        toast.error("A station with this ID already exists");
        return;
      }

      const stationRef = doc(DB, "Stations", stationId);
      await updateDoc(stationRef, {
        ...updatedData,
        batteryCount: parseInt(updatedData.batteryCount) || 0,
        price: parseFloat(updatedData.price) || 0,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Station updated successfully!");
      setEditingStation(null);

      // Refresh the stations list
      const querySnapshot = await getDocs(query(collection(DB, "Stations")));
      const stationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStations(stationsData);
    } catch (error) {
      console.error("Error updating station:", error);
      toast.error("Failed to update station: " + error.message);
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (window.confirm("Are you sure you want to delete this station?")) {
      try {
        await deleteDoc(doc(DB, "Stations", stationId));
        toast.success("Station deleted successfully!");

        // Refresh the stations list
        const querySnapshot = await getDocs(query(collection(DB, "Stations")));
        const stationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStations(stationsData);
      } catch (error) {
        console.error("Error deleting station:", error);
        toast.error("Failed to delete station");
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="New Stations" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            New Stations Management
          </h2>

          {userRole === ROLES.SUPER_ADMIN && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              <Icon icon="mdi:plus" className="w-5 h-5 mr-2" />
              Add New Station
            </motion.button>
          )}
        </div>

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <NewStationsTable
              stations={stations}
              onEdit={setEditingStation}
              onDelete={handleDeleteStation}
            />
          </div>
        </div>

        {showAddForm && (
          <AddStationForm
            onAdd={handleAddStation}
            onCancel={() => setShowAddForm(false)}
            franchiseeId={user?.franchiseeId}
          />
        )}

        {editingStation && (
          <EditStationForm
            station={editingStation}
            onUpdate={handleEditStation}
            onCancel={() => setEditingStation(null)}
          />
        )}
      </div>
    </>
  );
};

// Station Table Component
const NewStationsTable = ({ stations, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
              Station ID
            </th>
            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
              Name
            </th>
            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
              MAC Address
            </th>
            <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
              Battery Count
            </th>
            <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
              Price
            </th>
            <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
              Status
            </th>
            <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
              Last Updated
            </th>
            <th className="py-4 px-4 font-medium text-black dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr
              key={station.id}
              className="border-b border-stroke dark:border-strokedark"
            >
              <td className="border-b border-stroke py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                <p className="font-medium text-black dark:text-white">
                  {station.stationId || station.id}
                </p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">{station.name}</p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">{station.mac}</p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">
                  {station.batteryCount}
                </p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">${station.price}</p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <span
                  className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                    station.status === "online"
                      ? "bg-success text-success"
                      : "bg-danger text-danger"
                  }`}
                >
                  {station.status}
                </span>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">
                  {station.lastUpdated?.toDate?.()?.toLocaleDateString() ||
                    "N/A"}
                </p>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <div className="flex items-center space-x-3.5">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(station)}
                    className="hover:text-primary"
                  >
                    <Icon icon="mdi:pencil" className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(station.id)}
                    className="hover:text-danger"
                  >
                    <Icon icon="mdi:trash" className="w-5 h-5" />
                  </motion.button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Add Station Form Component
const AddStationForm = ({ onAdd, onCancel, franchiseeId }) => {
  const [formData, setFormData] = useState({
    stationId: "",
    name: "",
    mac: "",
    batteryCount: 0,
    price: 0,
    currency: "CAD",
    franchiseeId: franchiseeId || "",
    clientAddr: "",
    logo: "https://dashboard.nexy.ca/images/favicon.ico",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Add New Station
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Station ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="stationId"
              value={formData.stationId}
              onChange={handleChange}
              required
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              MAC Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="mac"
              value={formData.mac}
              onChange={handleChange}
              placeholder="e.g., 9803cfc176be"
              required
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: 12 hexadecimal characters (e.g., 9803cfc176be)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Battery Count
            </label>
            <input
              type="number"
              name="batteryCount"
              value={formData.batteryCount}
              onChange={handleChange}
              min="0"
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Client Address
            </label>
            <input
              type="text"
              name="clientAddr"
              value={formData.clientAddr}
              onChange={handleChange}
              className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
            >
              Add Station
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Edit Station Form Component
const EditStationForm = ({ station, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    stationId: station.stationId || "",
    name: station.name || "",
    mac: station.mac || "",
    batteryCount: station.batteryCount || 0,
    price: station.price || 0,
    currency: station.currency || "CAD",
    clientAddr: station.clientAddr || "",
    logo: station.logo || "https://dashboard.nexy.ca/images/favicon.ico",
    // QR Code section
    qrcode: {
      baseurl: station.qrcode?.baseurl || "https://app.nexy.ca/",
      generate: station.qrcode?.generate || true,
      height: station.qrcode?.height || 150,
      width: station.qrcode?.width || 150,
      x: station.qrcode?.x || 300,
      y: station.qrcode?.y || 1000,
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(station.id, formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("qrcode.")) {
      const qrField = name.split(".")[1];
      setFormData({
        ...formData,
        qrcode: {
          ...formData.qrcode,
          [qrField]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? parseInt(value) || 0
              : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "number" ? parseInt(value) || 0 : value,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50  flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-5xl mx-4"
      >
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Edit Station
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-6">
            <div className="w-1/2">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Station ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="stationId"
                  value={formData.stationId}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  MAC Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mac"
                  value={formData.mac}
                  onChange={handleChange}
                  placeholder="e.g., 9803cfc176be"
                  required
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 12 hexadecimal characters (e.g., 9803cfc176be)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Battery Count
                </label>
                <input
                  type="number"
                  name="batteryCount"
                  value={formData.batteryCount}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Client Address
                </label>
                <input
                  type="text"
                  name="clientAddr"
                  value={formData.clientAddr}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
            <div className="w-1/2">
              {/* QR Code Section */}
              <div className=" pt-4">
                <h4 className="text-md font-semibold mb-3 text-black dark:text-white">
                  QR Code Settings
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Base URL
                    </label>
                    <input
                      type="text"
                      name="qrcode.baseurl"
                      value={formData.qrcode.baseurl}
                      onChange={handleChange}
                      className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkdiv"
                        name="qrcode.generate"
                        checked={formData.qrcode.generate}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-black dark:text-white">
                        Generate QR Code
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Width
                    </label>
                    <input
                      type="number"
                      name="qrcode.width"
                      value={formData.qrcode.width}
                      onChange={handleChange}
                      min="50"
                      max="500"
                      className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Height
                    </label>
                    <input
                      type="number"
                      name="qrcode.height"
                      value={formData.qrcode.height}
                      onChange={handleChange}
                      min="50"
                      max="500"
                      className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      X Position
                    </label>
                    <input
                      type="number"
                      name="qrcode.x"
                      value={formData.qrcode.x}
                      onChange={handleChange}
                      min="0"
                      className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Y Position
                    </label>
                    <input
                      type="number"
                      name="qrcode.y"
                      value={formData.qrcode.y}
                      onChange={handleChange}
                      min="0"
                      className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
            >
              Update Station
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default withRoleAuth(NewStations, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
