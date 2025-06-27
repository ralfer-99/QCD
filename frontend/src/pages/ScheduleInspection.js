import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlusCircle, FaClipboardList, FaArrowLeft, FaUpload, FaImage } from "react-icons/fa";

const ScheduleInspection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [formData, setFormData] = useState({
    product: "",
    batchNumber: "",
    totalInspected: 0,
    notes: "",
  });
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Fetch product list for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await axios.get("http://localhost:5000/api/products", {
          withCredentials: true,
        });

        // Ensure we're handling the data correctly based on API response structure
        let productData = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          productData = response.data.data;
        } else if (Array.isArray(response.data)) {
          productData = response.data;
        } else {
          console.error("Unexpected API response format:", response.data);
        }

        console.log("Fetched products:", productData);
        setProducts(productData);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for the product dropdown with "add-new" option
    if (name === "product" && value === "add-new") {
      // Navigate to add product page
      navigate("/products/add");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalInspected" ? parseInt(value) || 0 : value,
    }));

    // Clear any previous error when user makes changes
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length < files.length) {
      setError(
        "Some files were rejected. Please ensure all files are images (JPG, PNG, GIF) under 5MB."
      );
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    // Remove image and preview at the specified index
    URL.revokeObjectURL(previewUrls[index]); // Free up memory
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product) {
      setError("Please select a product");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First create the inspection
      const response = await axios.post(
        "http://localhost:5000/api/inspections",
        formData,
        { withCredentials: true }
      );

      const inspectionId = response.data.data._id;

      // If images exist, upload them
      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach((image) => {
          imageFormData.append("images", image);
        });

        await axios.post(
          `http://localhost:5000/api/inspections/${inspectionId}/images`,
          imageFormData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      navigate("/inspection");
    } catch (err) {
      console.error("Error scheduling inspection:", err);
      setError(
        err.response?.data?.error ||
        "Failed to schedule inspection. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToAddProduct = (e) => {
    e.preventDefault();
    navigate("/products/add");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center">
              <FaClipboardList className="h-7 w-7 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule New Inspection</h1>
            </div>
            <button
              onClick={() => navigate("/inspection")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Inspections
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Main Content Card */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Inspection Details</h2>
            <p className="text-blue-100 text-sm">Fill out the form below to schedule a new quality inspection</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={goToAddProduct}
                    className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
                  >
                    <FaPlusCircle className="mr-1" /> Add New Product
                  </button>
                </div>

                {loadingProducts ? (
                  <div className="w-full border rounded-md px-3 py-2.5 bg-gray-50 text-gray-500 flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading products...
                  </div>
                ) : (
                  <>
                    {products.length > 0 ? (
                      <select
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} {product.category ? `(${product.category})` : ''}
                          </option>
                        ))}
                        <option value="add-new" className="font-semibold text-blue-600">
                          + Add New Product
                        </option>
                      </select>
                    ) : (
                      <div className="w-full border rounded-md px-4 py-3 bg-red-50 text-red-700 flex items-center justify-between">
                        <span>No products available.</span>
                        <button
                          onClick={goToAddProduct}
                          className="ml-2 font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          type="button"
                        >
                          Add products now
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Batch Number */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter batch number"
                />
              </div>

              {/* Total Inspected */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Total Inspected <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalInspected"
                  value={formData.totalInspected}
                  onChange={handleChange}
                  required
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter total items inspected"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows="4"
                  placeholder="Add any notes about this inspection"
                ></textarea>
              </div>

              {/* Image Upload */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images (optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors group">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <FaUpload className="mx-auto h-12 w-12" />
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          onChange={handleImageChange}
                          className="sr-only"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Up to 5 images (JPG, PNG, GIF, max 5MB each)
                    </p>
                  </div>
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 shadow-sm">
                          <img
                            src={url}
                            alt={`Preview ${index}`}
                            className="h-full w-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1.5 transform scale-75 group-hover:scale-100 transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 truncate text-center">
                          Image {index + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/inspection")}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaArrowLeft className="mr-2 -ml-1 h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || loadingProducts || products.length === 0}
                    className={`w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${(loading || loadingProducts || products.length === 0)
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <FaClipboardList className="mr-2 -ml-1 h-4 w-4" />
                        Schedule Inspection
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInspection;