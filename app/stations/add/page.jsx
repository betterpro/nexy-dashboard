"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import TextField from "@/theme/textField";
import Divider from "@/theme/divider";
import NumberField from "@/theme/numberField";
import TextAreaField from "@/theme/textareaField";
import DateField from "@/theme/dateField";
import TimezoneField from "@/theme/timezoneField";
import { formList } from "@/app/stations/formList";
import {
  GeoPoint,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { DB, storage } from "@/firebase";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import withRoleAuth from "@/components/context/withRoleAuth";
import { ROLES } from "@/components/context/roles";
import {
  GoogleMap,
  LoadScript,
  Autocomplete,
  Marker,
} from "@react-google-maps/api";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/context/AuthContext";

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

function AddStation() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm();
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [lat, setLat] = useState(center.lat);
  const [lng, setLng] = useState(center.lng);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const { user } = useAuth();
  const { userRole } = useAuth();

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
          } else {
            console.error("Error fetching place details:", status);
            toast.error("Failed to fetch place images");
          }
        }
      );
    } catch (error) {
      console.error("Error fetching place images:", error);
      toast.error("Failed to fetch place images");
    }
  };

  const onSubmit = async (data) => {
    try {
      // Set default timezone if not provided
      if (!data.timezone) {
        data.timezone = "America/Vancouver"; // Default timezone
      }

      // Upload logo to Firebase Storage and get the URL
      let logoURL = "";
      if (logoFile) {
        const logoRef = ref(storage, `stations/${data.stationId}/logo`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      // Upload images to Firebase Storage and get the URLs
      const imageUrls = [];
      for (const file of imageFiles) {
        const imageRef = ref(
          storage,
          `stations/${data.stationId}/images/${file.name}`
        );
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

      // Set data to Firestore
      const geoPoint = new GeoPoint(lat, lng);
      data.location = geoPoint;
      data.logo = logoURL;
      data.images = imageUrls;
      data.createDate = Timestamp.now();
      data.powerBank = Number(data.powerBank);
      data.slots = Number(data.slots);
      data.parking = Number(data.slots - data.powerBank);
      if (userRole === ROLES.SUPER_ADMIN) {
        data.franchiseeIds = ""; // Initialize empty array for super admin
      } else if (userRole === ROLES.FRANCHISEE) {
        data.franchiseeId = user?.franchiseeId ?? ""; // Initialize array with current franchisee's ID
      }

      // Add station to Firestore using setDoc with stationId as document ID
      await setDoc(doc(DB, "stations", data.stationId), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Station successfully added.");
    } catch (error) {
      console.error("Error adding station: ", error);
      toast.error("Failed to add station.");
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
      setLat(newLat);
      setLng(newLng);
      setValue("address", place?.formatted_address ?? "");
      setValue("phone", place?.formatted_phone_number ?? "");
      setValue("stationTitle", place?.name ?? "");
      setValue("website", place?.website ?? "");
      setValue("timezone", place?.utc_offset ?? "");

      // Fetch images when a place is selected
      if (place.place_id) {
        fetchPlaceImages(place.place_id);
      }

      if (mapRef.current) {
        mapRef.current.panTo({ lat: newLat, lng: newLng });
      }
    }
    if (place.opening_hours) {
      const periods = place.opening_hours.periods;
      const daysMap = ["su", "mo", "tu", "we", "th", "fr", "sa"];
      periods.forEach((period, index) => {
        const dayCode = daysMap[period.open.day];
        setValue(
          `${dayCode}Start`,
          `${period.open.hours
            .toString()
            .padStart(2, "0")}:${period.open.minutes
            .toString()
            .padStart(2, "0")}`
        );
        setValue(
          `${dayCode}End`,
          `${period.close.hours
            .toString()
            .padStart(2, "0")}:${period.close.minutes
            .toString()
            .padStart(2, "0")}`
        );
      });
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    setMap(map);
  };

  const onMapClick = (event) => {
    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    setLat(newLat);
    setLng(newLng);
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
      // Use our proxy endpoint to fetch the image
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Station
        </h1>
        <Link href="/stations">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            Back to Stations
          </motion.button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Map Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Location
            </h2>
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
                      placeholder="Search for a place"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-stroke bg-transparent font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                </Autocomplete>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{ lat, lng }}
                  zoom={10}
                  onClick={onMapClick}
                  onLoad={onMapLoad}
                >
                  <Marker position={{ lat, lng }} />
                </GoogleMap>
              </div>
            </LoadScript>
          </div>

          {/* Slot Info Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Slot Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Slots
                </label>
                <div className="flex flex-wrap gap-4">
                  {[4, 8, 48].map((slot) => (
                    <label
                      key={slot}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        value={slot}
                        className="form-radio text-primary"
                        {...register("slots")}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {slot} Slots
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of PowerBanks
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  {...register("powerBank")}
                />
              </div>
            </div>
          </div>

          {/* Station Info Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Station Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formList.map((item, index) => (
                <React.Fragment key={index}>
                  {item.type === "text" && (
                    <TextField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "number" && (
                    <NumberField
                      register={register}
                      title={item.title}
                      value={item.value ?? 0}
                      defaultValue={item.default}
                    />
                  )}
                  {item.type === "textarea" && (
                    <TextAreaField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "date" && (
                    <DateField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "timezone" && (
                    <TimezoneField
                      register={register}
                      title={item.title}
                      value={item.value}
                    />
                  )}
                  {item.type === "divider" && <Divider title={item.title} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Operating Hours Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Operating Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {["su", "mo", "tu", "we", "th", "fr", "sa"].map((day) => (
                <React.Fragment key={day}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {day.toUpperCase()} Start
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      {...register(`${day}Start`)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {day.toUpperCase()} End
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      {...register(`${day}End`)}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Media Section */}
          <div className="p-6.5 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Media
            </h2>

            {/* Manual Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Station Logo
                </label>
                <div className="space-y-4">
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Station Images
                </label>
                <div className="space-y-4">
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
                        {imageFiles.length} files selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(logoFile ||
            imageFiles.length > 0 ||
            suggestedImages.length > 0) && (
            <div className="p-6.5 border-b border-stroke dark:border-strokedark">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview & Select Logo
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use the buttons below each image to set it as the logo or add
                  it to the station images.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Show selected logo if exists */}
                  {logoFile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-primary/20 z-10 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          Current Logo
                        </span>
                      </div>
                      <Image
                        src={URL.createObjectURL(logoFile)}
                        alt="Selected logo"
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Show all images with action buttons */}
                  {imageFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Selected image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLogoFile(file);
                            setImageFiles((files) =>
                              files.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set as Logo
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setImageFiles((files) =>
                              files.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Show suggested images with action buttons */}
                  {suggestedImages.map((url, index) => (
                    <motion.div
                      key={`suggested-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={url}
                        alt={`Suggested image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSuggestedLogoSelect(url);
                            // Remove the image from suggested images if it's selected as logo
                            setSuggestedImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set as Logo
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSuggestedImageSelect(url);
                            // Remove the image from suggested images after adding it
                            setSuggestedImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Add to Images
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="p-6.5 flex justify-end gap-4">
            <Link href="/stations">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="flex items-center gap-2 rounded bg-gray-100 dark:bg-gray-800 px-6 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2 font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  Adding Station...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-5 h-5" />
                  Add Station
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default withRoleAuth(AddStation, [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE]);
