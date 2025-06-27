import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUserCircle,
  FaCheck,
  FaEye,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaClipboardList,
  FaSortAmountDown,
  FaExclamationTriangle
} from "react-icons/fa";

// ✅ Set axios to send cookies globally
axios.defaults.withCredentials = true;

const InspectionManagement = () => {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    product: "",
    inspector: "",
    search: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // ✅ Improved fetch inspections function with better data handling
  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/inspections", {
        withCredentials: true,
      });

      console.log("Fetched inspections response:", response.data);

      // Better handle the response data structure
      if (response.data.success) {
        // Handle standard API format with success property
        const inspectionData = response.data.data || [];

        // Transform the data to match the component's expected format
        const formattedInspections = inspectionData.map(inspection => ({
          id: inspection._id,
          date: new Date(inspection.date).toLocaleDateString(),
          product: inspection.product?.name || "Unknown Product",
          inspector: inspection.inspector?.name || "Unassigned",
          status: inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1), // Capitalize first letter
          batchNumber: inspection.batchNumber,
          totalInspected: inspection.totalInspected,
          defectsFound: inspection.defectsFound || 0,
          rawData: inspection // Keep raw data for potential detail view
        }));

        setInspections(formattedInspections);
      } else {
        // Fallback for unexpected response format
        console.error("Unexpected API response format:", response.data);
        setInspections([]);
      }
    } catch (error) {
      console.error("Failed to fetch inspections", error.response?.data || error.message);
      setInspections([]); // fallback to empty array on failure
      setError("Failed to load inspections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inspections on component mount
  useEffect(() => {
    fetchInspections();
  }, []);

  // Show confirm dialog helper function
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Complete inspection handler - updated to use the confirmation dialog
  const completeInspection = async (id) => {
    showConfirmDialog(
      "Complete Inspection",
      "Mark this inspection as complete?",
      async () => {
        setActionLoading(id);
        try {
          const response = await axios.put(
            `http://localhost:5000/api/inspections/${id}/complete`,
            {},
            { withCredentials: true }
          );

          if (response.data.success) {
            // Update local state to reflect the change
            setInspections(
              inspections.map(item =>
                item.id === id
                  ? {
                    ...item,
                    status: "Completed",
                  }
                  : item
              )
            );
          }
        } catch (error) {
          console.error("Failed to complete inspection:", error);
          setError(`Failed to complete inspection: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  // Delete inspection handler - updated to use the confirmation dialog
  const deleteInspection = async (id) => {
    showConfirmDialog(
      "Delete Inspection",
      "Are you sure you want to delete this inspection? This action cannot be undone.",
      async () => {
        setActionLoading(id);
        try {
          // Make the delete request
          const response = await axios.delete(
            `http://localhost:5000/api/inspections/${id}`,
            { withCredentials: true }
          );

          // If deletion is successful
          if (response.data.success) {
            // Remove the inspection from our local state
            setInspections(inspections.filter(item => item.id !== id));
          }
        } catch (error) {
          console.error("Failed to delete inspection:", error);

          // Show specific error message
          setError(`Failed to delete inspection: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleScheduleClick = () => {
    navigate("/inspection/schedule");
  };

  const viewInspectionDetails = (id) => {
    // Navigate to a detail view (you'll need to implement this)
    // navigate(`/inspection/${id}`);
    console.log("View inspection details for ID:", id);
  };

  const getUnique = (key) => {
    const values = [...new Set(inspections.map((item) => item[key]))];
    // Sort alphabetically, but ensure "pending" comes first for status
    if (key === "status") {
      return values.sort((a, b) => {
        if (a === "Pending") return -1;
        if (b === "Pending") return 1;
        return a.localeCompare(b);
      });
    }
    return values.sort();
  };

  const filteredData = inspections.filter((item) => {
    const statusMatch = !filters.status || item.status === filters.status;
    const productMatch = !filters.product || item.product === filters.product;
    const inspectorMatch =
      !filters.inspector || item.inspector === filters.inspector;
    const searchMatch =
      !filters.search ||
      item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.product.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(filters.search.toLowerCase());

    return statusMatch && productMatch && inspectorMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetFilters = () => {
    setFilters({ status: "", product: "", inspector: "", search: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <FaClipboardList className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Inspection Management</h1>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleScheduleClick}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
              >
                <FaCalendarAlt className="mr-2" />
                Schedule New Inspection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 shadow-sm border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  >
                    <span className="sr-only">Dismiss</span>
                    <FaTimes className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4 sm:mx-0 animate-fade-in-down">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">{confirmDialog.title}</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{confirmDialog.message}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search Field - Always Visible */}
              <div className="relative flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by ID, product, or batch number"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Toggle Filters Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`inline-flex items-center px-3 py-2 border ${isFilterOpen ? 'bg-gray-100 text-gray-700' : 'border-gray-300 text-gray-700 bg-white'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <FaFilter className="mr-2" />
                  {isFilterOpen ? "Hide Filters" : "Show Filters"}
                </button>

                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={!filters.status && !filters.product && !filters.inspector && !filters.search}
                >
                  <FaTimes className="mr-2" />
                  Clear
                </button>
              </div>
            </div>

            {/* Advanced Filters - Collapsible */}
            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="status-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {getUnique("status").map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="product-filter" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    id="product-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.product}
                    onChange={(e) => handleFilterChange("product", e.target.value)}
                  >
                    <option value="">All Products</option>
                    {getUnique("product").map((product) => (
                      <option key={product}>{product}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="inspector-filter" className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                  <select
                    id="inspector-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.inspector}
                    onChange={(e) => handleFilterChange("inspector", e.target.value)}
                  >
                    <option value="">All Inspectors</option>
                    {getUnique("inspector").map((inspector) => (
                      <option key={inspector}>{inspector}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(filters.status || filters.product || filters.inspector || filters.search) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.status && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Status: {filters.status}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("status", "")}
                      className="ml-1 inline-flex flex-shrink-0 items-center text-blue-400 focus:outline-none"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {filters.product && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    Product: {filters.product}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("product", "")}
                      className="ml-1 inline-flex flex-shrink-0 items-center text-purple-400 focus:outline-none"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {filters.inspector && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Inspector: {filters.inspector}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("inspector", "")}
                      className="ml-1 inline-flex flex-shrink-0 items-center text-green-400 focus:outline-none"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    Search: {filters.search}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("search", "")}
                      className="ml-1 inline-flex flex-shrink-0 items-center text-gray-400 focus:outline-none"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Loading inspections...</p>
          </div>
        )}

        {/* Inspections Table - Desktop */}
        {!loading && filteredData.length > 0 && (
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Inspected</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Defects</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {item.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.batchNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaUserCircle className="h-4 w-4 text-gray-400 mr-2" />
                          {item.inspector}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.totalInspected}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.defectsFound}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center space-x-2">
                          {item.status === "Pending" && (
                            <button
                              title="Complete Inspection"
                              className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-150 ease-in-out disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              onClick={() => completeInspection(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <span className="inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <FaCheck className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            title="View Details"
                            className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => viewInspectionDetails(item.id)}
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete Inspection"
                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-150 ease-in-out disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            onClick={() => deleteInspection(item.id)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <FaTimes className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inspections Cards - Mobile View */}
        {!loading && filteredData.length > 0 && (
          <div className="md:hidden space-y-4">
            {filteredData.map((item) => (
              <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 leading-6 mb-2">
                      {item.product}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Batch:</span>{" "}
                      <span className="font-medium">{item.batchNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>{" "}
                      <span className="font-medium">{item.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Inspector:</span>{" "}
                      <span className="font-medium">{item.inspector}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ID:</span>{" "}
                      <span className="font-mono text-xs">{item.id.substring(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Inspected:</span>{" "}
                      <span className="font-medium">{item.totalInspected}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Defects:</span>{" "}
                      <span className="font-medium">{item.defectsFound}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end space-x-3">
                    {item.status === "Pending" && (
                      <button
                        title="Complete Inspection"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        onClick={() => completeInspection(item.id)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        ) : (
                          <FaCheck className="mr-1 h-4 w-4" />
                        )}
                        Complete
                      </button>
                    )}
                    <button
                      title="View Details"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => viewInspectionDetails(item.id)}
                    >
                      <FaEye className="mr-1 h-4 w-4" />
                      Details
                    </button>
                    <button
                      title="Delete Inspection"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => deleteInspection(item.id)}
                      disabled={actionLoading === item.id}
                    >
                      {actionLoading === item.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <FaTimes className="mr-1 h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredData.length === 0 && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No inspections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.status || filters.product || filters.inspector || filters.search ?
                "Try adjusting your search filters to find what you're looking for." :
                "Start by scheduling your first inspection."}
            </p>
            <div className="mt-6">
              {filters.status || filters.product || filters.inspector || filters.search ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScheduleClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaCalendarAlt className="mr-2 h-4 w-4" aria-hidden="true" />
                  Schedule New Inspection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count and refresh button */}
        {!loading && filteredData.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
            <div>
              Showing {filteredData.length} inspection{filteredData.length !== 1 && 's'}
            </div>
            <button
              onClick={fetchInspections}
              disabled={loading}
              className="mt-3 sm:mt-0 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <FaSyncAlt className="mr-2 h-4 w-4" />
              )}
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionManagement;
