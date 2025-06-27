import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDownload, FaCalendarAlt, FaBoxOpen, FaUser, FaFilter, FaChartLine } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

// Fetch analytics data from backend with better error handling
const fetchStats = async (filters = {}) => {
  try {
    // Convert filter object to query parameters
    const queryParams = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `http://localhost:5000/api/analytics${queryParams ? `?${queryParams}` : ''}`;
    const response = await axios.get(url, {
      withCredentials: true,
      timeout: 10000 // Add timeout to prevent long waiting
    });
    console.log("Fetched analytics data:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch analytics:", error);
    throw error;
  }
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    product: '',
  });
  const [products, setProducts] = useState([]);

  // Fetch products for filter dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products", {
          withCredentials: true,
          timeout: 5000 // Add timeout
        });
        if (response.data && response.data.success) {
          setProducts(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products for filter", err);
        // Don't set error state here, as this is not critical
      }
    };

    fetchProducts();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const getStats = async () => {
      try {
        setLoading(true);
        const data = await fetchStats(filters);

        if (data && data.success && data.data) {
          // Transform data for recharts components
          const transformedData = {
            ...data.data,
            passRate: parseFloat(100 - data.data.overallMetrics.overallDefectRate).toFixed(2),
            totalDefects: data.data.overallMetrics.totalDefectsFound,
            avgInspectionTime: "12.5 mins", // Example, replace with real data if available

            // Transform defect trends for charts
            defectTrendData: data.data.defectTrend.map(item => ({
              name: item.date,
              rate: parseFloat(item.defectRate),
              inspections: item.inspectionCount,
              defects: item.defectCount
            })),

            // Transform defect by types for bar chart
            defectCategories: data.data.defectsByType.map(item => ({
              name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
              value: item.count
            })),

            // Transform defect by severity for pie chart
            defectSeverity: data.data.defectsBySeverity.map(item => ({
              name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
              value: item.count
            })),

            // Transform inspector data
            inspectorPerformanceData: data.data.inspectorPerformance.map(inspector => ({
              name: inspector.inspectorName || 'Unknown',
              inspections: inspector.inspectionCount,
              defectRate: parseFloat(inspector.defectRate.toFixed(2))
            })),

            // Monthly trends
            monthlyData: data.data.monthlyTrend.map(month => ({
              name: month.period,
              inspections: month.inspectionCount,
              defectRate: parseFloat(month.defectRate.toFixed(2))
            }))
          };

          setStats(transformedData);
        } else {
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("⚠️ Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, [filters]);

  const handleExport = () => {
    if (!stats) return;

    try {
      // Create CSV content
      let csv = "Quality Metrics Report\n";
      csv += `Generated Date,${new Date().toLocaleDateString()}\n\n`;
      csv += "Overall Metrics\n";
      csv += `Total Inspections,${stats.overallMetrics.totalInspections}\n`;
      csv += `Total Items Inspected,${stats.overallMetrics.totalItemsInspected}\n`;
      csv += `Total Defects Found,${stats.overallMetrics.totalDefectsFound}\n`;
      csv += `Overall Defect Rate,${stats.overallMetrics.overallDefectRate}%\n\n`;

      csv += "Defects by Type\n";
      stats.defectsByType.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });

      csv += "\nDefects by Severity\n";
      stats.defectsBySeverity.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "quality_analytics_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data. Please try again.");
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    // The useEffect will re-run with the new filters
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading analytics data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-lg">
        <h3 className="font-bold text-xl mb-2">Error Loading Data</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Quality Analysis Report</h2>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold hover:bg-blue-700"
        >
          <FaDownload /> Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FaFilter className="mr-2" /> Filter Quality Metrics
        </h3>
        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
          <div className="w-64">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-64">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-64">
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              name="product"
              value={filters.product}
              onChange={handleFilterChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Overall pass rate"
          mainValue={`${stats?.passRate || 0}%`}
          change={stats?.overallMetrics?.overallDefectRate < 5 ? "Good" : "Needs Improvement"}
          changeColor={stats?.overallMetrics?.overallDefectRate < 5 ? "text-green-500" : "text-yellow-500"}
          subtitle="Based on defect rate"
          icon={<FaChartLine className="text-blue-500" />}
        />

        <StatCard
          title="Total defects found"
          mainValue={stats?.totalDefects || 0}
          change={`${stats?.defectsByType?.length || 0} different types`}
          changeColor="text-blue-500"
          subtitle="Across all inspections"
          icon={<FaBoxOpen className="text-red-500" />}
        />

        <StatCard
          title="Total inspections"
          mainValue={stats?.overallMetrics?.totalInspections || 0}
          change={`${stats?.overallMetrics?.totalItemsInspected || 0} items`}
          changeColor="text-green-500"
          subtitle="Items inspected"
          icon={<FaUser className="text-green-500" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Defect Rate Trend Chart */}
        <ChartCard title="Defect Rate Trend" subtitle="Over time period">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.defectTrendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                name="Defect Rate (%)"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Defect Categories Bar Chart */}
        <ChartCard title="Defects by Type" subtitle="Distribution of defect types">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.defectCategories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Defects by Severity */}
        <ChartCard title="Defects by Severity" subtitle="Critical, Major, Minor breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.defectSeverity || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats?.defectSeverity?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Critical' ? '#ff6384' :
                      entry.name === 'Major' ? '#ffce56' :
                        '#36a2eb'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} defects`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Inspector Performance */}
        <ChartCard title="Inspector Performance" subtitle="Defect rates by inspector">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.inspectorPerformanceData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="inspections" name="Inspections" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="defectRate" name="Defect Rate (%)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly Trend Chart - Full Width */}
      <ChartCard title="Monthly Quality Metrics" subtitle="Inspections and defect rates by month">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.monthlyData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="inspections"
              name="Inspection Count"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="defectRate"
              name="Defect Rate (%)"
              stroke="#82ca9d"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Product Rankings */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-xl font-bold mb-4">Product Quality Ranking</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Total Inspected</th>
                <th className="py-3 px-4 text-left">Defects Found</th>
                <th className="py-3 px-4 text-left">Defect Rate</th>
                <th className="py-3 px-4 text-left">Quality Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.productDefectRates?.map((product, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4">{product.productName}</td>
                  <td className="py-3 px-4">{product.totalInspected}</td>
                  <td className="py-3 px-4">{product.totalDefects}</td>
                  <td className="py-3 px-4">{product.defectRate.toFixed(2)}%</td>
                  <td className="py-3 px-4">
                    <QualityBadge rate={product.defectRate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Component for stat cards
const StatCard = ({ title, mainValue, change, changeColor, subtitle, icon }) => (
  <div className="bg-white rounded-lg shadow p-6 flex">
    {icon && <div className="mr-4 text-3xl">{icon}</div>}
    <div>
      <h3 className="text-sm text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="mt-1 flex items-baseline">
        <p className="text-3xl font-semibold">{mainValue}</p>
        <p className={`ml-2 ${changeColor}`}>{change}</p>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// Component for chart containers
const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
    <div className="mt-4">{children}</div>
  </div>
);

// Component for filter buttons (can be used in the future)
const FilterButton = ({ icon, label }) => (
  <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-md border hover:bg-gray-50 transition">
    {icon} {label}
  </button>
);

// Quality badge component
const QualityBadge = ({ rate }) => {
  let color, text;

  if (rate < 2) {
    color = 'bg-green-100 text-green-800';
    text = 'Excellent';
  } else if (rate < 5) {
    color = 'bg-blue-100 text-blue-800';
    text = 'Good';
  } else if (rate < 10) {
    color = 'bg-yellow-100 text-yellow-800';
    text = 'Average';
  } else {
    color = 'bg-red-100 text-red-800';
    text = 'Poor';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {text}
    </span>
  );
};

export default AnalyticsPage;
