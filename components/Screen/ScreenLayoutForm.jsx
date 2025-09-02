"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ScreenLayoutForm = ({ layout, onSave, saving, stationId }) => {
  const [formData, setFormData] = useState({
    top: {
      height: 80,
      assets: [],
    },
    bottom: {
      height: 20,
      assets: [],
    },
  });

  useEffect(() => {
    if (layout) {
      setFormData({
        top: {
          height: layout.top?.height || 80,
          assets: layout.top?.assets || [],
        },
        bottom: {
          height: layout.bottom?.height || 20,
          assets: layout.bottom?.assets || [],
        },
      });
    }
  }, [layout]);

  const updateSectionHeight = (section, height) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        height: parseInt(height) || 0,
      },
    }));
  };

  const addAsset = (section) => {
    const newAsset = {
      type: "image",
      duration: 5,
      link: "",
      file: null,
    };

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        assets: [...prev[section].assets, newAsset],
      },
    }));
  };

  const removeAsset = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        assets: prev[section].assets.filter((_, i) => i !== index),
      },
    }));
  };

  const updateAsset = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        assets: prev[section].assets.map((asset, i) =>
          i === index ? { ...asset, [field]: value } : asset
        ),
      },
    }));
  };

  const handleFileUpload = async (section, index, file) => {
    try {
      // Update the asset with the file
      updateAsset(section, index, "file", file);

      // Generate a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;

      // Create storage reference with correct path structure
      const storageRef = ref(
        storage,
        `screens/${stationId}/${section}/${fileName}`
      );

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update the asset with the download URL
      updateAsset(section, index, "link", downloadURL);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Upload any pending files before saving
    const uploadPromises = [];

    formData.top.assets.forEach((asset, index) => {
      if (asset.file && !asset.link) {
        uploadPromises.push(handleFileUpload("top", index, asset.file));
      }
    });

    formData.bottom.assets.forEach((asset, index) => {
      if (asset.file && !asset.link) {
        uploadPromises.push(handleFileUpload("bottom", index, asset.file));
      }
    });

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    // Clean up the form data (remove file objects before saving)
    const cleanFormData = {
      top: {
        ...formData.top,
        assets: formData.top.assets.map((asset) => ({
          type: asset.type,
          duration: asset.duration,
          link: asset.link,
        })),
      },
      bottom: {
        ...formData.bottom,
        assets: formData.bottom.assets.map((asset) => ({
          type: asset.type,
          duration: asset.duration,
          link: asset.link,
        })),
      },
    };

    // Convert to JSON string before saving
    const layoutJsonString = JSON.stringify(cleanFormData);

    onSave(layoutJsonString);
  };

  const renderAssetForm = (section, asset, index) => (
    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold">Asset {index + 1}</h4>
        <button
          type="button"
          onClick={() => removeAsset(section, index)}
          className="text-danger hover:text-red-700"
        >
          <Icon icon="mdi:delete" height={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={asset.type}
            onChange={(e) =>
              updateAsset(section, index, "type", e.target.value)
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            min="1"
            value={asset.duration}
            onChange={(e) =>
              updateAsset(
                section,
                index,
                "duration",
                parseInt(e.target.value) || 1
              )
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-medium mb-1">
            {asset.link && !asset.file ? "Replace File" : "Upload File"}
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept={asset.type === "image" ? "image/*" : "video/*"}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(section, index, file);
                }
              }}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required={!asset.link}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = asset.type === "image" ? "image/*" : "video/*";
                input.required = !asset.link;
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleFileUpload(section, index, file);
                  }
                };
                input.click();
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
            >
              <Icon icon="mdi:upload" height={16} />
            </button>
          </div>
          {asset.link && !asset.file && (
            <p className="text-xs text-gray-500 mt-1">
              Upload a new file to replace the current asset
            </p>
          )}
        </div>
      </div>

      {asset.file && (
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Preview</label>
          <div className="border border-gray-200 rounded-lg p-2">
            {asset.type === "image" ? (
              <img
                src={URL.createObjectURL(asset.file)}
                alt="Preview"
                className="max-w-full h-32 object-contain mx-auto"
              />
            ) : (
              <video
                src={URL.createObjectURL(asset.file)}
                controls
                className="max-w-full h-32 mx-auto"
              />
            )}
          </div>
        </div>
      )}

      {asset.link && !asset.file && (
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">
            Current Asset
          </label>
          <div className="border border-gray-200 rounded-lg p-2">
            {asset.type === "image" ? (
              <img
                src={asset.link}
                alt="Current asset"
                className="max-w-full h-32 object-contain mx-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            ) : (
              <video
                src={asset.link}
                controls
                className="max-w-full h-32 mx-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            )}

            {/* Fallback for failed media */}
            <div className="hidden text-center text-gray-500 py-4">
              <Icon
                icon="mdi:alert-circle"
                height={24}
                className="mx-auto mb-2"
              />
              <p className="text-sm">Failed to load current asset</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Top Section</h3>
          <button
            type="button"
            onClick={() => addAsset("top")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 flex items-center gap-2"
          >
            <Icon icon="mdi:plus" height={16} />
            Add Asset
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Height (px)</label>
          <input
            type="number"
            min="1"
            value={formData.top.height}
            onChange={(e) => updateSectionHeight("top", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-4">
          {formData.top.assets.map((asset, index) =>
            renderAssetForm("top", asset, index)
          )}

          {formData.top.assets.length === 0 && (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Icon
                icon="mdi:image-outline"
                height={48}
                className="mx-auto mb-2"
              />
              <p>No assets added yet</p>
              <p className="text-sm">
                Click &quot;Add Asset&quot; and upload a file to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Bottom Section</h3>
          <button
            type="button"
            onClick={() => addAsset("bottom")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 flex items-center gap-2"
          >
            <Icon icon="mdi:plus" height={16} />
            Add Asset
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Height (px)</label>
          <input
            type="number"
            min="1"
            value={formData.bottom.height}
            onChange={(e) => updateSectionHeight("bottom", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-4">
          {formData.bottom.assets.map((asset, index) =>
            renderAssetForm("bottom", asset, index)
          )}

          {formData.bottom.assets.length === 0 && (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Icon
                icon="mdi:image-outline"
                height={48}
                className="mx-auto mb-2"
              />
              <p>No assets added yet</p>
              <p className="text-sm">
                Click &quot;Add Asset&quot; and upload a file to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Icon icon="mdi:content-save" height={16} />
              Save Layout
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ScreenLayoutForm;
