"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const ScreenPreview = ({ layout, layoutSize }) => {
  const [currentTopAsset, setCurrentTopAsset] = useState(0);
  const [currentBottomAsset, setCurrentBottomAsset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Parse layout if it's a string, otherwise use as is
  const parsedLayout = typeof layout === "string" ? JSON.parse(layout) : layout;

  // Extract assets with proper fallbacks
  const topAssets = parsedLayout?.top?.assets || [];
  const bottomAssets = parsedLayout?.bottom?.assets || [];
  const topHeight = parsedLayout?.top?.height || 80;
  const bottomHeight = parsedLayout?.bottom?.height || 20;

  // Get layout size with fallbacks
  const screenWidth = (layoutSize?.width || 800) / 2;
  const screenHeight = (layoutSize?.height || 1080) / 2;

  // Reset current asset indices when assets change
  useEffect(() => {
    if (topAssets.length > 0 && currentTopAsset >= topAssets.length) {
      setCurrentTopAsset(0);
    }
  }, [topAssets, currentTopAsset]);

  useEffect(() => {
    if (bottomAssets.length > 0 && currentBottomAsset >= bottomAssets.length) {
      setCurrentBottomAsset(0);
    }
  }, [bottomAssets, currentBottomAsset]);

  // Auto-rotate through top assets
  useEffect(() => {
    if (!isPlaying || topAssets.length === 0) return;

    const currentAsset = topAssets[currentTopAsset];
    if (!currentAsset) return;

    const interval = setInterval(() => {
      setCurrentTopAsset((prev) => (prev + 1) % topAssets.length);
    }, (currentAsset.duration || 5) * 1000);

    return () => clearInterval(interval);
  }, [currentTopAsset, topAssets, isPlaying]);

  // Auto-rotate through bottom assets
  useEffect(() => {
    if (!isPlaying || bottomAssets.length === 0) return;

    const currentAsset = bottomAssets[currentBottomAsset];
    if (!currentAsset) return;

    const interval = setInterval(() => {
      setCurrentBottomAsset((prev) => (prev + 1) % bottomAssets.length);
    }, (currentAsset.duration || 5) * 1000);

    return () => clearInterval(interval);
  }, [currentBottomAsset, bottomAssets, isPlaying]);

  // Show loading if layout is not yet available
  if (!parsedLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screen layout...</p>
        </div>
      </div>
    );
  }

  const getCurrentTopAsset = () => {
    if (topAssets.length === 0) return null;
    return topAssets[currentTopAsset];
  };

  const getCurrentBottomAsset = () => {
    if (bottomAssets.length === 0) return null;
    return bottomAssets[currentBottomAsset];
  };

  const renderAsset = (asset, sectionName) => {
    if (!asset) {
      return (
        <div className="flex items-center justify-center bg-gray-100 text-gray-500 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Icon
              icon="mdi:image-outline"
              height={32}
              className="mx-auto mb-2"
            />
            <p className="text-sm">No {sectionName} assets configured</p>
          </div>
        </div>
      );
    }

    // Check if asset has a valid link
    if (!asset.link) {
      return (
        <div className="flex items-center justify-center bg-gray-100 text-gray-500 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Icon
              icon="mdi:alert-circle"
              height={32}
              className="mx-auto mb-2"
            />
            <p className="text-sm">Asset has no valid URL</p>
            <p className="text-xs text-gray-400">Please upload a file</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden">
        {asset.type === "image" ? (
          <img
            src={asset.link}
            alt={`${sectionName} asset`}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error("Failed to load image:", asset.link);
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : (
          <video
            src={asset.link}
            className="w-full h-full object-contain"
            autoPlay
            muted
            loop
            onError={(e) => {
              console.error("Failed to load video:", asset.link);
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}

        {/* Fallback for failed media */}
        <div className="hidden items-center justify-center bg-gray-100 text-gray-500 w-full h-full">
          <div className="text-center">
            <Icon
              icon="mdi:alert-circle"
              height={32}
              className="mx-auto mb-2"
            />
            <p className="text-sm">Failed to load media</p>
            <p className="text-xs text-gray-400 break-all">{asset.link}</p>
          </div>
        </div>

        {/* Asset info overlay */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {asset.type} • {asset.duration}s
        </div>
      </div>
    );
  };
  console.log(screenWidth, screenHeight, topHeight, bottomHeight);
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
          >
            <Icon icon={isPlaying ? "mdi:pause" : "mdi:play"} height={16} />
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Top:</span>
            <span className="text-sm font-medium">
              {topAssets.length > 0
                ? `${currentTopAsset + 1}/${topAssets.length}`
                : "0/0"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Bottom:</span>
            <span className="text-sm font-medium">
              {bottomAssets.length > 0
                ? `${currentBottomAsset + 1}/${bottomAssets.length}`
                : "0/0"}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Screen Size: {screenWidth} × {screenHeight}
          px
        </div>
      </div>

      {/* Screen Preview */}
      <div className="flex justify-center">
        <div
          className="border-4 border-gray-800 rounded-lg overflow-hidden bg-black"
          style={{
            width: `${screenWidth}px`,
            height: `${screenHeight}px`,

            aspectRatio: `${screenHeight} / ${screenWidth}`,
          }}
        >
          {/* Top Section */}
          <div
            className="border-b-2 border-gray-600"
            style={{
              maxHeight: `${
                (topHeight / 100) * screenHeight
              }px, width:${screenWidth}px`,
            }}
          >
            {renderAsset(getCurrentTopAsset(), "top")}
          </div>

          {/* Bottom Section */}
          <div
            style={{
              maxHeight: `${(bottomHeight / 100) * screenHeight}px`,
              width: `${screenWidth}px`,
            }}
          >
            {renderAsset(getCurrentBottomAsset(), "bottom")}
          </div>
        </div>
      </div>

      {/* Layout Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Section Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Top Section</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Height:</span> {topHeight}px
            </p>
            <p>
              <span className="font-medium">Assets:</span> {topAssets.length}
            </p>
            {topAssets.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-2">Asset List:</p>
                <div className="space-y-1">
                  {topAssets.map((asset, index) => {
                    return (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          index === currentTopAsset
                            ? "bg-primary text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        <div>
                          {index + 1}. {asset.name} {asset.type} (
                          {asset.duration}
                          s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Bottom Section</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Height:</span> {bottomHeight}px
            </p>
            <p>
              <span className="font-medium">Assets:</span> {bottomAssets.length}
            </p>
            {bottomAssets.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-2">Asset List:</p>
                <div className="space-y-1">
                  {bottomAssets.map((asset, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        index === currentBottomAsset
                          ? "bg-primary text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      <div>
                        {index + 1}. {asset.type} ({asset.duration}s)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenPreview;
