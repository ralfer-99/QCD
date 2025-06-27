import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../images/logo1.jpg";
import { User, Menu, X, Sun, Moon } from "lucide-react";
import axios from "axios";
import { AlertBell, AlertDropdown, useAlerts } from "../components/AlertSystem";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { unreadCount } = useAlerts();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });

        if (response.data.success) {
          setCurrentUser(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const getNavLinks = () => {
    const links = [
      "Dashboard",
      "Defects",
      "Inspection",
      "AI Detection",
      "Analytics",
    ];

    if (currentUser && currentUser.role === "admin") {
      links.push("User Management");
    }

    return links;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setMenuOpen(!menuOpen);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleAlerts = () => {
    setAlertsOpen(!alertsOpen);
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 font-sans ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} min-h-screen transition-colors duration-200`}>
      <header className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-sm transition-colors duration-200`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0" aria-label="Home">
                <img src={logo} alt="Company Logo" className="w-12 h-12 object-contain" />
              </Link>

              <button
                type="button"
                className={`ml-2 sm:hidden inline-flex items-center justify-center p-2 rounded-md ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150`}
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                onKeyDown={handleKeyDown}
              >
                <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
                {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:block">
              <ul className="flex space-x-8">
                {getNavLinks().map((text, i) => (
                  <li key={i}>
                    <NavLink
                      to={`/${text.toLowerCase().replace(" ", "-")}`}
                      className={({ isActive }) =>
                        isActive
                          ? `${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium border-b-2 border-blue-600 px-1 py-2 inline-flex items-center text-sm transition-colors`
                          : `${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'} px-1 py-2 inline-flex items-center text-sm transition-colors`
                      }
                    >
                      {text}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${darkMode ? 'text-yellow-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              {/* Alert Notification Icon with Badge */}
              <div className="relative">
                <button
                  onClick={toggleAlerts}
                  className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'} p-2 rounded-full transition-colors relative`}
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <AlertBell />
                </button>
                {alertsOpen && (
                  <AlertDropdown onClose={() => setAlertsOpen(false)} />
                )}
              </div>

              <Link
                to="/user-profile"
                className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'} p-2 rounded-full transition-colors`}
                aria-label="User profile"
              >
                <User size={22} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`${menuOpen ? 'block' : 'hidden'} sm:hidden`}
            id="mobile-menu"
          >
            <ul className="pt-2 pb-3 space-y-1">
              {getNavLinks().map((text, i) => (
                <li key={i}>
                  <NavLink
                    to={`/${text.toLowerCase().replace(" ", "-")}`}
                    className={({ isActive }) =>
                      isActive
                        ? `${darkMode ? 'bg-gray-700 text-blue-400 border-blue-400' : 'bg-blue-50 text-blue-600 border-blue-600'} block pl-3 pr-4 py-2 border-l-4 font-medium`
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400 border-transparent' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-transparent'} block pl-3 pr-4 py-2 border-l-4`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {text}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className={`pt-4 pb-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="px-2 space-y-3">
                <button
                  onClick={toggleTheme}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'} transition-colors`}
                >
                  {darkMode ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="flex flex-col space-y-1">
                  <Link
                    to="/alert-notifications"
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="relative mr-3">
                      <AlertBell />
                    </div>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/user-profile"
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={20} className="mr-3" aria-hidden="true" />
                    <span>Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default NavBar;
