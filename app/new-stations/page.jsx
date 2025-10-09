"use client";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";
import { DB, storage } from "@/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import withRoleAuth from "@/components/context/withRoleAuth";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  GoogleMap,
  LoadScript,
  Autocomplete,
  Marker,
} from "@react-google-maps/api";
import Image from "next/image";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "0.5rem",
};

const center = {
  lat: 49.2827,
  lng: -123.1207,
};

const libraries = ["places"];

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

      // Check if station ID already exists (document ID will be the stationId)
      const existingStation = stations.find(
        (station) => station.id === stationData.stationId
      );
      if (existingStation) {
        toast.error("A station with this ID already exists");
        return;
      }

      // Process data and convert types
      const processedData = {
        ...stationData,
        // Parse numbers
        batteryCount: parseInt(stationData.batteryCount) || 0,
        slots: parseInt(stationData.slots) || 0,
        powerBank: parseInt(stationData.powerBank) || 0,
        parking: parseInt(stationData.parking) || 0,
        price: parseFloat(stationData.price) || 0,
        revenueShare: parseFloat(stationData.revenueShare) || null,
      };

      // Create GeoPoint if lat/lng are provided
      if (stationData.lat && stationData.lng) {
        processedData.location = new GeoPoint(
          parseFloat(stationData.lat),
          parseFloat(stationData.lng)
        );
      }

      // Remove lat/lng as they're now in location
      delete processedData.lat;
      delete processedData.lng;

      const newStation = {
        ...processedData,
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
        createDate: serverTimestamp(),
      };

      // Use stationId as the document ID
      const stationRef = doc(DB, "Stations", stationData.stationId);
      await setDoc(stationRef, newStation);
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

      // Find the current station being edited
      const currentStation = stations.find((s) => s.id === stationId);

      // Only check for duplicate stationId if it's being changed
      if (
        currentStation &&
        currentStation.stationId !== updatedData.stationId
      ) {
        const existingStations = stations.filter(
          (station) => station.stationId === updatedData.stationId
        );
        if (existingStations.length > 0) {
          toast.error("A station with this ID already exists");
          return;
        }
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

  const handleToggleField = async (stationId, field, currentValue) => {
    try {
      const stationRef = doc(DB, "Stations", stationId);
      await updateDoc(stationRef, {
        [field]: !currentValue,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setStations((prevStations) =>
        prevStations.map((station) =>
          station.id === stationId
            ? { ...station, [field]: !currentValue }
            : station
        )
      );

      toast.success(`Station ${field} updated successfully!`);
    } catch (error) {
      console.error(`Error updating station ${field}:`, error);
      toast.error(`Failed to update station ${field}`);
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
              onToggle={handleToggleField}
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
const NewStationsTable = ({ stations, onEdit, onDelete, onToggle }) => {
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
            <th className="min-w-[80px] py-4 px-4 font-medium text-black dark:text-white text-center">
              Active
            </th>
            <th className="min-w-[80px] py-4 px-4 font-medium text-black dark:text-white text-center">
              Private
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
                <div className="flex justify-center">
                  <button
                    onClick={() =>
                      onToggle(station.id, "active", station.active)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      station.active
                        ? "bg-primary"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={station.active ? "Active" : "Inactive"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        station.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </td>
              <td className="border-b border-stroke py-5 px-4 dark:border-strokedark">
                <div className="flex justify-center">
                  <button
                    onClick={() =>
                      onToggle(station.id, "private", station.private)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      station.private
                        ? "bg-warning"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={station.private ? "Private" : "Public"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        station.private ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
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
    description: "",
    category: "battery",
    subCategory: "",
    mac: "",
    // Operational counts
    batteryCount: 0,
    slots: 0,
    powerBank: 0,
    parking: 0,
    price: 0,
    currency: "CAD",
    // Contact info
    email: "",
    phone: "",
    tel: "",
    website: "",
    // Social media
    facebook: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    // Location
    address: "",
    lat: center.lat,
    lng: center.lng,
    // Locale
    locale: "en-CA",
    timezone: "America/Toronto",
    private: false,
    active: true,
    // Relationships
    franchiseeId: franchiseeId || "",
    partnerId: "",
    agreementId: "",
    revenueShare: 0,
    // Media
    clientAddr: "",
    logo: "https://dashboard.nexy.ca/images/favicon.ico",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const fetchPlaceImages = async (placeId) => {
    try {
      const service = new google.maps.places.PlacesService(map);

      service.getDetails(
        {
          placeId: placeId,
          fields: ["photos"],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place.photos
          ) {
            const photos = place.photos.slice(0, 15).map((photo) => {
              return photo.getUrl({
                maxWidth: 800,
                maxHeight: 800,
              });
            });

            setSuggestedImages(photos);
          }
        }
      );
    } catch (error) {
      console.error("Error fetching place images:", error);
    }
  };

  const onLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const { location } = place.geometry;
      const newLat = location.lat();
      const newLng = location.lng();

      setFormData((prev) => ({
        ...prev,
        lat: newLat,
        lng: newLng,
        address: place?.formatted_address ?? prev.address,
        phone: place?.formatted_phone_number ?? prev.phone,
        name: place?.name ?? prev.name,
        website: place?.website ?? prev.website,
      }));

      if (place.place_id) {
        fetchPlaceImages(place.place_id);
      }

      if (mapRef.current) {
        mapRef.current.panTo({ lat: newLat, lng: newLng });
      }
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    setMap(map);
  };

  const onMapClick = (event) => {
    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    setFormData((prev) => ({
      ...prev,
      lat: newLat,
      lng: newLng,
    }));
  };

  const handleSuggestedLogoSelect = async (url) => {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const file = new File([blob], "logo.jpg", { type: "image/jpeg" });
      setLogoFile(file);
    } catch (error) {
      console.error("Error loading image:", error);
      toast.error("Failed to download logo");
    }
  };

  const handleSuggestedImageSelect = async (url) => {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const file = new File([blob], `image-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      setImageFiles((prev) => [...prev, file]);
    } catch (error) {
      console.error("Error loading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Upload logo to Firebase Storage and get the URL
      let logoURL = formData.logo;
      if (logoFile) {
        const logoRef = ref(storage, `stations/${formData.stationId}/logo`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      // Upload images to Firebase Storage and get the URLs
      const imageUrls = [];
      for (const file of imageFiles) {
        const imageRef = ref(
          storage,
          `stations/${formData.stationId}/images/${file.name}`
        );
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

      // Prepare final data with uploaded media
      const finalData = {
        ...formData,
        logo: logoURL,
        images: imageUrls,
      };

      onAdd(finalData);
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media files");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-6xl mx-4 my-6"
      >
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Add New Station
        </h3>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {/* Google Maps Location Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Location Search
            </h4>
            <LoadScript
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <div className="space-y-4">
                <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                  <div className="relative">
                    <Icon
                      icon="mdi:map-search"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    />
                    <input
                      type="text"
                      placeholder="Search for a place on Google Maps..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-stroke bg-transparent font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                </Autocomplete>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{ lat: formData.lat, lng: formData.lng }}
                  zoom={10}
                  onClick={onMapClick}
                  onLoad={onMapLoad}
                >
                  <Marker position={{ lat: formData.lat, lng: formData.lng }} />
                </GoogleMap>
              </div>
            </LoadScript>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="battery">Battery</option>
                  <option value="powerbank">Powerbank</option>
                  <option value="parking">Parking</option>
                  <option value="charging">Charging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Sub Category
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label className="text-sm font-medium text-black dark:text-white">
                    Active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="private"
                    checked={formData.private}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label className="text-sm font-medium text-black dark:text-white">
                    Private
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Settings */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Operational Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Slots
                </label>
                <input
                  type="number"
                  name="slots"
                  value={formData.slots}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Power Bank
                </label>
                <input
                  type="number"
                  name="powerBank"
                  value={formData.powerBank}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Parking Spots
                </label>
                <input
                  type="number"
                  name="parking"
                  value={formData.parking}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
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
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Social Media
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/..."
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  TikTok
                </label>
                <input
                  type="url"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@..."
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/..."
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Location
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., 43.6532"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., -79.3832"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Locale
                </label>
                <input
                  type="text"
                  name="locale"
                  value={formData.locale}
                  onChange={handleChange}
                  placeholder="e.g., en-CA"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  placeholder="e.g., America/Toronto"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Relationships */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Relationships
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Partner ID
                </label>
                <input
                  type="text"
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Agreement ID
                </label>
                <input
                  type="text"
                  name="agreementId"
                  value={formData.agreementId}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Revenue Share (%)
                </label>
                <input
                  type="number"
                  name="revenueShare"
                  value={formData.revenueShare}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
              Media Upload
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Station Logo
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke bg-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon icon="mdi:image-plus" className="w-5 h-5" />
                    <span>Choose Logo</span>
                  </label>
                  {logoFile && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {logoFile.name}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Station Images
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles([...e.target.files])}
                    className="hidden"
                    id="images-upload"
                  />
                  <label
                    htmlFor="images-upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke bg-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon icon="mdi:image-multiple" className="w-5 h-5" />
                    <span>Choose Images</span>
                  </label>
                  {imageFiles.length > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFiles.length} files
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media Preview */}
          {(logoFile ||
            imageFiles.length > 0 ||
            suggestedImages.length > 0) && (
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-3 text-black dark:text-white border-b border-stroke dark:border-strokedark pb-2">
                Media Preview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {logoFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-primary/20 z-10 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        Logo
                      </span>
                    </div>
                    <Image
                      src={URL.createObjectURL(logoFile)}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                )}

                {imageFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setLogoFile(file);
                          setImageFiles((files) =>
                            files.filter((_, i) => i !== index)
                          );
                        }}
                        className="px-3 py-1 bg-primary text-white text-sm rounded opacity-0 group-hover:opacity-100"
                      >
                        Set as Logo
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setImageFiles((files) =>
                            files.filter((_, i) => i !== index)
                          );
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}

                {suggestedImages.map((url, index) => (
                  <motion.div
                    key={`suggested-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={url}
                      alt={`Suggested ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSuggestedLogoSelect(url);
                          setSuggestedImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="px-3 py-1 bg-primary text-white text-sm rounded opacity-0 group-hover:opacity-100"
                      >
                        Set as Logo
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSuggestedImageSelect(url);
                          setSuggestedImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded opacity-0 group-hover:opacity-100"
                      >
                        Add Image
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
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
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
          >
            Add Station
          </motion.button>
        </div>
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
    franchiseeId: station.franchiseeId || "", // Preserve franchiseeId
    // QR Code section
    qrcode: {
      baseurl: station.qrcode?.baseurl || "https://app.nexy.ca/",
      generate: station.qrcode?.generate || true,
      height: station.qrcode?.height || 175,
      width: station.qrcode?.width || 175,
      x: station.qrcode?.x || 350,
      y: station.qrcode?.y || 1100,
    },
    // Pricing section
    pricing: {
      currency: station.pricing?.currency || "CAD",
      dailyLimitAmount: station.pricing?.dailyLimitAmount || 6,
      dailyLimitPeriods: station.pricing?.dailyLimitPeriods || 3,
      dailyLimitResetTime: station.pricing?.dailyLimitResetTime || "00:00:00",
      damageFee: station.pricing?.damageFee || 30,
      depositAmount: station.pricing?.depositAmount || 30,
      depositRefundable: station.pricing?.depositRefundable ?? true,
      depositRequired: station.pricing?.depositRequired ?? true,
      freePeriodMinutes: station.pricing?.freePeriodMinutes || 5,
      freePeriodRequiresPreAuth:
        station.pricing?.freePeriodRequiresPreAuth ?? true,
      freeTimeMinutes: station.pricing?.freeTimeMinutes || 5,
      hasDailyLimit: station.pricing?.hasDailyLimit ?? true,
      hasDiscounts: station.pricing?.hasDiscounts ?? false,
      hasFreePeriod: station.pricing?.hasFreePeriod ?? true,
      lateReturnFee: station.pricing?.lateReturnFee || 30,
      lostBatteryFee: station.pricing?.lostBatteryFee || 30,
      minimumRentalMinutes: station.pricing?.minimumRentalMinutes || 15,
      preAuthAmount: station.pricing?.preAuthAmount || 30,
      pricePerHour: station.pricing?.pricePerHour || 2,
      pricePerPeriod: station.pricing?.pricePerPeriod || 2,
      pricePeriod: station.pricing?.pricePeriod || "hour",
      pricePeriodDuration: station.pricing?.pricePeriodDuration || 1,
      requiresPreAuth: station.pricing?.requiresPreAuth ?? true,
      returnDurationLimitHours: station.pricing?.returnDurationLimitHours || 72,
      taxIncluded: station.pricing?.taxIncluded ?? true,
      taxRate: station.pricing?.taxRate || 5,
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
    } else if (name.startsWith("pricing.")) {
      const pricingField = name.split(".")[1];
      setFormData({
        ...formData,
        pricing: {
          ...formData.pricing,
          [pricingField]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? parseFloat(value) || 0
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-6xl mx-4 my-6"
      >
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Edit Station
        </h3>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
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
                        type="checkbox"
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

          {/* Pricing Section */}
          <div className="border-t border-stroke dark:border-strokedark pt-6 mt-6">
            <h4 className="text-md font-semibold mb-4 text-black dark:text-white">
              Pricing Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Pricing */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Currency
                </label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Price Per Hour
                </label>
                <input
                  type="number"
                  name="pricing.pricePerHour"
                  value={formData.pricing.pricePerHour}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Price Per Period
                </label>
                <input
                  type="number"
                  name="pricing.pricePerPeriod"
                  value={formData.pricing.pricePerPeriod}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Price Period
                </label>
                <select
                  name="pricing.pricePeriod"
                  value={formData.pricing.pricePeriod}
                  onChange={handleChange}
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                  <option value="hour">Hour</option>
                  <option value="minute">Minute</option>
                  <option value="day">Day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Price Period Duration
                </label>
                <input
                  type="number"
                  name="pricing.pricePeriodDuration"
                  value={formData.pricing.pricePeriodDuration}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="pricing.taxRate"
                  value={formData.pricing.taxRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Deposit Settings */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  name="pricing.depositAmount"
                  value={formData.pricing.depositAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Pre-Auth Amount
                </label>
                <input
                  type="number"
                  name="pricing.preAuthAmount"
                  value={formData.pricing.preAuthAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Minimum Rental Minutes
                </label>
                <input
                  type="number"
                  name="pricing.minimumRentalMinutes"
                  value={formData.pricing.minimumRentalMinutes}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Fees */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Damage Fee
                </label>
                <input
                  type="number"
                  name="pricing.damageFee"
                  value={formData.pricing.damageFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Late Return Fee
                </label>
                <input
                  type="number"
                  name="pricing.lateReturnFee"
                  value={formData.pricing.lateReturnFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Lost Battery Fee
                </label>
                <input
                  type="number"
                  name="pricing.lostBatteryFee"
                  value={formData.pricing.lostBatteryFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Free Period */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Free Period Minutes
                </label>
                <input
                  type="number"
                  name="pricing.freePeriodMinutes"
                  value={formData.pricing.freePeriodMinutes}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Free Time Minutes
                </label>
                <input
                  type="number"
                  name="pricing.freeTimeMinutes"
                  value={formData.pricing.freeTimeMinutes}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Return Duration Limit (Hours)
                </label>
                <input
                  type="number"
                  name="pricing.returnDurationLimitHours"
                  value={formData.pricing.returnDurationLimitHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Daily Limit Settings */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Daily Limit Amount
                </label>
                <input
                  type="number"
                  name="pricing.dailyLimitAmount"
                  value={formData.pricing.dailyLimitAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Daily Limit Periods
                </label>
                <input
                  type="number"
                  name="pricing.dailyLimitPeriods"
                  value={formData.pricing.dailyLimitPeriods}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Daily Limit Reset Time
                </label>
                <input
                  type="time"
                  name="pricing.dailyLimitResetTime"
                  value={formData.pricing.dailyLimitResetTime}
                  onChange={handleChange}
                  step="1"
                  className="w-full rounded border border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Boolean Settings */}
              <div className="col-span-1 md:col-span-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.depositRequired"
                      checked={formData.pricing.depositRequired}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Deposit Required
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.depositRefundable"
                      checked={formData.pricing.depositRefundable}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Deposit Refundable
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.requiresPreAuth"
                      checked={formData.pricing.requiresPreAuth}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Requires Pre-Auth
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.taxIncluded"
                      checked={formData.pricing.taxIncluded}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Tax Included
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.hasFreePeriod"
                      checked={formData.pricing.hasFreePeriod}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Has Free Period
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.freePeriodRequiresPreAuth"
                      checked={formData.pricing.freePeriodRequiresPreAuth}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Free Period Requires Pre-Auth
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.hasDailyLimit"
                      checked={formData.pricing.hasDailyLimit}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Has Daily Limit
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="pricing.hasDiscounts"
                      checked={formData.pricing.hasDiscounts}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4"
                    />
                    <label className="text-sm font-medium text-black dark:text-white">
                      Has Discounts
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
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
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
          >
            Update Station
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default withRoleAuth(NewStations, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
