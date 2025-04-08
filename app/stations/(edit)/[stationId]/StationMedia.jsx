"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { DB, storage } from "@/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Image from "next/image";

function StationMedia({ stationId }) {
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingLogo, setExistingLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const dataRef = await getDoc(doc(DB, "stations", stationId));
      if (dataRef.exists()) {
        const data = dataRef.data();
        setExistingImages(data.images || []);
        setExistingLogo(data.logo || null);
      }
    } catch (error) {
      console.error("Error fetching station data:", error);
      toast.error("Failed to fetch station data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [stationId]);

  const handleImageSelect = async (url, isLogo = false) => {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const file = new File(
        [blob],
        isLogo ? "logo.jpg" : `image-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      if (isLogo) {
        setLogoFile(file);
      } else {
        setImageFiles((prev) => [...prev, file]);
      }
    } catch (error) {
      console.error("Error loading image:", error);
      toast.error(`Failed to download ${isLogo ? "logo" : "image"}`);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      let logoURL = existingLogo;

      if (logoFile) {
        const logoRef = ref(storage, `stations/${stationId}/logo`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      const newImageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const imageRef = ref(
            storage,
            `stations/${stationId}/images/${file.name}`
          );
          await uploadBytes(imageRef, file);
          return getDownloadURL(imageRef);
        })
      );

      const allImageUrls = [...existingImages, ...newImageUrls];

      await setDoc(
        doc(DB, "stations", stationId),
        {
          logo: logoURL,
          images: allImageUrls,
        },
        { merge: true }
      );

      toast.success("Media successfully updated");
      setLogoFile(null);
      setImageFiles([]);
      setExistingImages(allImageUrls);
      setExistingLogo(logoURL);
    } catch (error) {
      console.error("Error updating media:", error);
      toast.error("Failed to update media");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
    >
      <div className="p-6.5 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Station Media
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isLoading || (!logoFile && imageFiles.length === 0)}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                Updating Media...
              </>
            ) : (
              <>
                <Icon icon="mdi:check" className="w-5 h-5" />
                Update Media
              </>
            )}
          </motion.button>
        </div>

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

        {/* Preview Section */}
        {(logoFile ||
          imageFiles.length > 0 ||
          existingImages.length > 0 ||
          existingLogo) && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use the buttons below each image to set it as the logo or remove
              it.
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

              {/* Show existing logo if exists */}
              {existingLogo && !logoFile && (
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
                    src={existingLogo}
                    alt="Station logo"
                    fill
                    className="object-cover"
                  />
                </motion.div>
              )}

              {/* Show existing images */}
              {existingImages.map((url, index) => (
                <motion.div
                  key={`existing-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <Image
                    src={url}
                    alt={`Existing image ${index + 1}`}
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
                        setLogoFile(null);
                        handleImageSelect(url, true);
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
                        setExistingImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </motion.button>
                  </div>
                </motion.div>
              ))}

              {/* Show new images */}
              {imageFiles.map((file, index) => (
                <motion.div
                  key={`new-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index + 1}`}
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
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StationMedia;
