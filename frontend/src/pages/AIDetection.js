import { useState, useEffect } from "react";
import { Upload, Camera, FileCheck2, AlertTriangle, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const AIDetection = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    productName: "",
    batch: "",
    date: "",
    confidence: "",
    status: "",
    type: "",
    imageUrl: null,
  });
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const token = localStorage.getItem("token"); // adjust if your token is stored differently

  // Helper to resolve image URL (backend might return relative path)
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("/")) return url;
    // If relative path without leading slash, add it
    return `/uploads/${url}`;
  };

  // Fetch initial defect data from backend API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/ai/data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        if (data.imageUrl) setImage(resolveImageUrl(data.imageUrl));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Cleanup preview URL on unmount
    return () => {
      if (imageFile) URL.revokeObjectURL(image);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload image and send it to backend for TensorFlow detection
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clean up previous preview URL if exists
    if (imageFile) URL.revokeObjectURL(image);

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    // Send image file to backend for detection
    setDetecting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("image", file);

      const res = await fetch(`${BACKEND_URL}/api/ai/detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      });

      if (!res.ok) throw new Error("Detection failed");

      const detectionResult = await res.json();
      // Map backend response to flat formData for the UI
      if (detectionResult && detectionResult.data && detectionResult.data.detection) {
        setFormData({
          confidence: detectionResult.data.detection.confidence || "",
          type: detectionResult.data.detection.defectType || "",
          status: detectionResult.data.detection.hasDefect ? "Defective" : "Good",
          imageUrl: detectionResult.data.imageUrl || null,
          id: detectionResult.data.id || ("AUTO_ID_" + Date.now()),
          productName: detectionResult.data.productName || "Default Product",
          batch: detectionResult.data.batch || ("BATCH_" + Math.floor(1000 + Math.random() * 9000)),
          date: new Date().toISOString().slice(0, 10),
        });
        if (detectionResult.data.imageUrl) setImage(resolveImageUrl(detectionResult.data.imageUrl));
      } else {
        // fallback: set raw response
        setFormData(detectionResult);
      }
    } catch (error) {
      console.error(error);
      alert("Defect detection failed. Try again.");
    } finally {
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Loading AI detection system...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-red-500" />
          <p className="mt-4 text-red-600 font-medium">Failed to load AI detection system.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return "gray";

    status = status.toLowerCase();
    if (status.includes("good")) return "green";
    if (status.includes("defect")) return "red";
    return "yellow";
  };

  const statusColor = getStatusColor(formData.status);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Defect Detection</h1>
          <p className="mt-1 text-gray-500">Upload an image to detect product defects using AI</p>
        </div>

        <div className="inline-flex shadow-sm rounded-md">
          <label htmlFor="upload-image" className={`
            flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
            ${detecting ?
              "bg-gray-200 text-gray-500 cursor-not-allowed" :
              "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm hover:shadow-md"
            }
            transition-all duration-200 font-medium text-sm
          `}>
            {detecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Detect Image
              </>
            )}
          </label>
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={detecting}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-blue-600" />
              Product Image Analysis
            </h2>
          </div>

          <div className="p-5">
            {image ? (
              <div className="relative rounded-lg overflow-hidden shadow-inner border border-gray-200">
                <img
                  src={image}
                  alt="Product for defect detection"
                  className="w-full object-contain max-h-[400px]"
                />
                {formData.status && (
                  <div className={`
                    absolute top-4 right-4 px-3 py-1.5 rounded-full
                    text-sm font-medium
                    ${statusColor === "green" ? "bg-green-100 text-green-800" :
                      statusColor === "red" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"}
                  `}>
                    {formData.status}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center p-6">
                <div className="bg-gray-100 rounded-full p-3 mb-3">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600">No image uploaded</p>
                <p className="text-sm text-gray-500 mt-2">Upload an image to begin AI detection</p>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500 flex items-center">
              <FileCheck2 className="h-4 w-4 mr-1.5" />
              Supported formats: JPG, PNG, WEBP
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
              Detection Results
            </h2>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">ID</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formData.id || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Product Name</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formData.productName || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Batch Number</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formData.batch || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Detected Date</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formData.date || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center">
                  AI Confidence Score
                  <span className="ml-1 text-yellow-500">⚡</span>
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-medium">
                  {formData.confidence || "—"}
                  {formData.confidence && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${parseFloat(formData.confidence) || 0}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <div className={`
                  border rounded-lg px-3 py-2 font-medium
                  ${statusColor === "green" ? "bg-green-50 text-green-800 border-green-200" :
                    statusColor === "red" ? "bg-red-50 text-red-800 border-red-200" :
                      "bg-yellow-50 text-yellow-800 border-yellow-200"}
                `}>
                  {formData.status || "—"}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Defect Type</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
                  {formData.type || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">AI</span>
                </div>
                <p>The AI detection system analyzes the image using a TensorFlow neural network to identify potential defects.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDetection;
