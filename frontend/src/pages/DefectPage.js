import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaFilter,
  FaPlus,
  FaSearch,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaUndo
} from "react-icons/fa";

const DefectManagement = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    dateRange: "",
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ✅ Fetch defects and ensure response is an array
  const fetchDefects = async () => {
    setFetchLoading(true);
    try {
      // Apply backend filters if needed
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);

      // Only add date params if we have a dateRange filter
      if (filters.dateRange) {
        const today = new Date();
        let startDate = new Date();

        // Calculate startDate based on the date range selection
        if (filters.dateRange === '7days') {
          startDate.setDate(today.getDate() - 7);
        } else if (filters.dateRange === '30days') {
          startDate.setDate(today.getDate() - 30);
        } else if (filters.dateRange === '90days') {
          startDate.setDate(today.getDate() - 90);
        }

        queryParams.append('startDate', startDate.toISOString().split('T')[0]);
        queryParams.append('endDate', today.toISOString().split('T')[0]);
      }

      const url = `http://localhost:5000/api/defects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log("Fetching defects from:", url);

      const response = await axios.get(url, {
        withCredentials: true
      });

      const data = response.data;
      const defectArray = Array.isArray(data)
        ? data
        : Array.isArray(data.defects)
          ? data.defects
          : data.data || [];

      console.log("Fetched defects:", defectArray.length);
      setDefects(defectArray);
    } catch (error) {
      console.error("Failed to fetch defects", error.response?.data || error.message);
      setDefects([]);
      setError("Failed to load defects. Please try again.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [filters.status, filters.type, filters.dateRange]); // Re-fetch when these filters change

  const uniqueValues = (key) => {
    // Get unique values from the defects array for the specified key
    const values = [...new Set(defects.map((d) => d[key]).filter(Boolean))];
    return values.sort();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Add delete defect function
  const handleDeleteDefect = async (id) => {
    if (!window.confirm("Are you sure you want to delete this defect?")) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/defects/${id}`, {
        withCredentials: true
      });
      // Remove the deleted defect from state
      setDefects(defects.filter(defect => (defect.id || defect._id) !== id));
    } catch (error) {
      console.error("Failed to delete defect:", error);
      setError(`Failed to delete defect: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering (for the search field)
  const filteredData = defects.filter((defect) => {
    // Only apply search filter here, other filters are applied via API
    const searchMatch = !filters.search ||
      defect.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      defect._id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      defect.type?.toLowerCase().includes(filters.search.toLowerCase());

    return searchMatch;
  });

  // Reset all filters
  const clearFilters = () => {
    setFilters({
      status: "",
      type: "",
      dateRange: "",
      search: ""
    });
    setIsFilterOpen(false);
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "major":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "minor":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "investigating":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "resolved":
        return "bg-gray-100 text-gray-500 border-gray-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <h1 className="text-2xl font-bold text-gray-900">Defect Management</h1>
            <button
              onClick={() => navigate("/defects/log")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FaPlus className="mr-2" />
              Log New Defect
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <p className="text-red-800">{error}</p>
              <button
                className="ml-auto text-red-500 hover:text-red-700"
                onClick={() => setError(null)}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            {/* Search field - always visible */}
            <div className="relative flex items-center w-full sm:w-auto">
              <FaSearch className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search defects..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors duration-200 ${isFilterOpen
                    ? "bg-gray-100 text-gray-700"
                    : "bg-white text-gray-700 border border-gray-300"
                  }`}
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200"
                disabled={!filters.status && !filters.type && !filters.dateRange && !filters.search}
              >
                <FaUndo className="mr-2" />
                Clear
              </button>
              <button
                onClick={fetchDefects}
                className="flex items-center px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-md shadow-sm hover:bg-gray-700 transition-colors duration-200"
              >
                {fetchLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
                Refresh
              </button>
            </div>
          </div>

          {/* Advanced filters - collapsible */}
          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="visual">Visual</option>
                  <option value="functional">Functional</option>
                  <option value="dimensional">Dimensional</option>
                  <option value="structural">Structural</option>
                  <option value="finish">Finish</option>
                  <option value="material">Material</option>
                  <option value="assembly">Assembly</option>
                  <option value="electrical">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                >
                  <option value="">All Time</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                </select>
              </div>
            </div>
          )}

          {/* Active filters display */}
          {(filters.status || filters.type || filters.dateRange) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
              {filters.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                  <button
                    onClick={() => handleFilterChange("status", "")}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <FaTimes />
                  </button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                  <button
                    onClick={() => handleFilterChange("type", "")}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <FaTimes />
                  </button>
                </span>
              )}
              {filters.dateRange && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Date: {filters.dateRange === '7days' ? 'Last 7 days' :
                    filters.dateRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
                  <button
                    onClick={() => handleFilterChange("dateRange", "")}
                    className="ml-1 text-green-500 hover:text-green-700"
                  >
                    <FaTimes />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Defects Table/Card View */}
        {fetchLoading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-blue-500 text-4xl" />
          </div>
        ) : filteredData.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((defect) => (
                      <tr key={defect.id || defect._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {(defect.id || defect._id)?.substring(0, 6)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                          {defect.description?.substring(0, 60) || "No description"}
                          {(defect.description?.length || 0) > 60 ? "..." : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {defect.type?.charAt(0).toUpperCase() + defect.type?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeClass(defect.severity)}`}>
                            {defect.severity?.charAt(0).toUpperCase() + defect.severity?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(defect.status)}`}>
                            {defect.status?.charAt(0).toUpperCase() + defect.status?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {defect.reportedBy?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(defect.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteDefect(defect.id || defect._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 focus:outline-none focus:underline transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredData.map((defect) => (
                <div key={defect.id || defect._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {defect.description?.substring(0, 100) || "No description"}
                          {(defect.description?.length || 0) > 100 ? "..." : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{(defect.id || defect._id)?.substring(0, 10)}...</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDefect(defect.id || defect._id)}
                        disabled={loading}
                        className="text-red-500 hover:bg-red-100 p-1 rounded transition-colors duration-200"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(defect.status)}`}>
                        {defect.status?.charAt(0).toUpperCase() + defect.status?.slice(1) || "Unknown"}
                      </span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeClass(defect.severity)}`}>
                        {defect.severity?.charAt(0).toUpperCase() + defect.severity?.slice(1) || "Unknown"}
                      </span>
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {defect.type?.charAt(0).toUpperCase() + defect.type?.slice(1) || "Unknown"}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                      <div>Reported by: {defect.reportedBy?.name || "Unknown"}</div>
                      <div>{new Date(defect.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <FaFilter className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No defects found</h3>
            <p className="mt-1 text-gray-500">
              {filters.status || filters.type || filters.dateRange || filters.search ?
                "Try adjusting your filters or search terms" :
                "Start by logging a new defect"}
            </p>
            <div className="mt-6">
              {filters.status || filters.type || filters.dateRange || filters.search ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => navigate("/defects/log")}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaPlus className="mr-2" />
                  Log New Defect
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        {filteredData.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredData.length} {filteredData.length === 1 ? 'defect' : 'defects'}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-center">
              <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
              <p className="text-gray-700">Processing your request...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectManagement;
