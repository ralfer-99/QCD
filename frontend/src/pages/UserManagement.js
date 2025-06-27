import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaSearch,
  FaFilter,
  FaPlus,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaUserCog,
  FaClipboardCheck
} from "react-icons/fa";

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch current user and user list on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current user
        const currentUserRes = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });

        const loggedInUser = currentUserRes.data.data;
        setCurrentUser(loggedInUser);

        console.log("Current user:", loggedInUser);

        // Restrict access to admin only
        if (loggedInUser.role !== 'admin') {
          console.log("Access restricted - redirecting to dashboard");
          navigate('/dashboard');
          return;
        }

        // Only fetch users if current user is admin
        const usersRes = await axios.get("http://localhost:5000/api/users", {
          withCredentials: true,
        });

        if (usersRes.data.success) {
          console.log("Users fetched:", usersRes.data.data);

          // Map users to include status (consider all users active for now)
          const mappedUsers = usersRes.data.data.map(user => ({
            ...user,
            status: "Active"
          }));

          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");

        // If unauthorized, redirect to login
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (index) => {
    const userToDelete = filteredUsers[index];

    // Create a modal-like confirmation instead of window.confirm
    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`, {
        withCredentials: true,
      });

      // Update local state after successful deletion
      setUsers(users.filter(user => user._id !== userToDelete._id));

    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-indigo-500" />;
      case 'manager':
        return <FaUserCog className="text-blue-500" />;
      case 'inspector':
        return <FaClipboardCheck className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inspector':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("All Roles");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <FaExclamationTriangle className="mr-2" />
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If current user is not admin, this component should not render
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <FaExclamationTriangle className="mr-2" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p className="text-gray-700 mb-6">
            This page is restricted to administrators only.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or department"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${showFilters
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <FaFilter className="mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              <button
                onClick={clearFilters}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 ${!searchQuery && roleFilter === "All Roles" ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={!searchQuery && roleFilter === "All Roles"}
              >
                <FaTimes className="mr-2" />
                Clear
              </button>

              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate("/user/add")}
              >
                <FaPlus className="mr-2" />
                Add User
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Role
                  </label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option>All Roles</option>
                    <option>admin</option>
                    <option>manager</option>
                    <option>inspector</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active filters */}
          {(searchQuery || roleFilter !== "All Roles") && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
                  Search: {searchQuery}
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="ml-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              {roleFilter !== "All Roles" && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                  Role: {roleFilter}
                  <button
                    type="button"
                    onClick={() => setRoleFilter("All Roles")}
                    className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-600"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FaUser className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || roleFilter !== "All Roles"
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "Start by adding a new user to the system."}
              </p>
              <div className="mt-6">
                {searchQuery || roleFilter !== "All Roles" ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/user/add")}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="mr-2 -ml-1 h-5 w-5" />
                    Add New User
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <tr key={user._id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-medium text-blue-800">
                              {user.name.charAt(0).toUpperCase()}
                              {user.name.split(' ')[1] ? user.name.split(' ')[1].charAt(0).toUpperCase() : ''}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {user.status && (
                              <div className="text-xs text-gray-500">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                  {user.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                          <span className="mr-1.5">{getRoleIcon(user.role)}</span>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentUser._id !== user._id ? (
                          <button
                            onClick={() => handleDelete(index)}
                            className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150"
                            title="Delete User"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
