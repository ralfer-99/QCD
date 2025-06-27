import React, { useState, useEffect } from "react";
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import { Bar, Line, Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [upcomingInspections, setUpcomingInspections] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [defectData, setDefectData] = useState(null);
  const [inspectionTrendData, setInspectionTrendData] = useState(null);
  const [defectResolutionData, setDefectResolutionData] = useState(null);
  const [openIssues, setOpenIssues] = useState([]);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [productDefectRates, setProductDefectRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch quality metrics from the API with proper error handling
        let metricsData = null;
        try {
          const qualityResponse = await axios.get("http://localhost:5000/api/analytics", {
            withCredentials: true
          });
          console.log("Quality metrics:", qualityResponse.data);

          if (qualityResponse.data && qualityResponse.data.success) {
            metricsData = qualityResponse.data.data;
            setQualityMetrics(metricsData);

            // Create product defect rate chart data
            if (metricsData.productDefectRates && metricsData.productDefectRates.length > 0) {
              setProductDefectRates({
                labels: metricsData.productDefectRates.map(item => item.productName),
                datasets: [
                  {
                    label: "Defect Rate (%)",
                    data: metricsData.productDefectRates.map(item => parseFloat(item.defectRate.toFixed(2))),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                  }
                ]
              });
            }

            // Create defect trend chart data
            if (metricsData.defectTrend && metricsData.defectTrend.length > 0) {
              setDefectData({
                labels: metricsData.defectTrend.map(item => item.date),
                datasets: [
                  {
                    label: "Defect Rate (%)",
                    data: metricsData.defectTrend.map(item => parseFloat(item.defectRate.toFixed(2))),
                    borderColor: "#ff6384",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    fill: true,
                    tension: 0.4
                  }
                ]
              });
            }

            // Create defect by type chart
            if (metricsData.defectsByType && metricsData.defectsByType.length > 0) {
              setDefectResolutionData({
                labels: metricsData.defectsByType.map(item => item._id),
                datasets: [
                  {
                    data: metricsData.defectsByType.map(item => item.count),
                    backgroundColor: [
                      "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff",
                      "#ff9f40", "#c9cbcf", "#7bc043", "#fdd835", "#f37736"
                    ]
                  }
                ]
              });
            }

            // Create inspection trend data with error handling
            if (metricsData.monthlyTrend && metricsData.monthlyTrend.length > 0) {
              const trendData = metricsData.monthlyTrend;
              setInspectionTrendData({
                labels: trendData.map(item => item.period),
                datasets: [
                  {
                    label: "Inspections",
                    data: trendData.map(item => item.inspectionCount),
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                  },
                  {
                    label: "Defect Rate (%)",
                    data: trendData.map(item => parseFloat(item.defectRate.toFixed(2))),
                    borderColor: "#f43f5e",
                    backgroundColor: "rgba(244, 63, 94, 0.2)",
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                  }
                ]
              });
            }
          }
        } catch (err) {
          console.error("Failed to load analytics data:", err);
        }

        // Use mock stats data instead of fetching from potentially invalid endpoint
        setStats([
          {
            label: "On-time Inspection Rate",
            value: "92%",
            sub: "Last 30 days",
            percent: "75%"
          },
          {
            label: "First Pass Yield",
            value: "87.3%",
            sub: "Avg. across all products",
            percent: "60%"
          },
          {
            label: "Defect Reduction",
            value: "-18%",
            sub: "Compared to last month",
            percent: "90%"
          }
        ]);

        // Fetch inspections safely
        try {
          const inspectionsRes = await axios.get("http://localhost:5000/api/inspections", {
            withCredentials: true
          });

          if (inspectionsRes.data && inspectionsRes.data.success) {
            const pendingInspections = inspectionsRes.data.data
              .filter(insp => insp.status === 'pending')
              .map(insp => ({
                id: insp._id,
                name: insp.product ? insp.product.name : 'Unknown Product',
                date: new Date(insp.date).toLocaleDateString(),
                batchNumber: insp.batchNumber
              }));
            setUpcomingInspections(pendingInspections);
          }
        } catch (err) {
          console.error("Failed to fetch inspections:", err);
          setUpcomingInspections([]);
        }

        // Sample recent activity data (static to avoid errors)
        setRecentActivity([
          { text: "Critical defect logged in batch B-1234", time: "10 mins ago" },
          { text: "Inspection completed for batch A-5678", time: "1 hour ago" },
          { text: "Quality report generated", time: "3 hours ago" },
          { text: "New product added to quality control", time: "1 day ago" }
        ]);

        // Sample open issues data (static to avoid errors)
        setOpenIssues([
          { name: "John Smith", issues: 5, priority: "High", color: "text-red-600" },
          { name: "Sara Johnson", issues: 3, priority: "Medium", color: "text-yellow-600" },
          { name: "Robert Lee", issues: 7, priority: "Low", color: "text-green-600" }
        ]);

      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadPDF = () => {
    const button = document.getElementById("download-btn");
    const input = document.getElementById("dashboard-print");

    if (button) button.style.visibility = "hidden";

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("quality-metrics-report.pdf");
      if (button) button.style.visibility = "visible";
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
          <FaExclamationTriangle className="inline-block mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 font-sans bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <button
          id="download-btn"
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FaChartLine /> Download Quality Report
        </button>
      </div>

      <div id="dashboard-print" className="space-y-6">
        {/* Quality Metrics Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Quality Metrics Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            {qualityMetrics && (
              <>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Overall Defect Rate</div>
                  <div className="text-2xl font-bold">{qualityMetrics.overallMetrics?.overallDefectRate || "0"}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {qualityMetrics.overallMetrics?.totalDefectsFound || 0} defects / {qualityMetrics.overallMetrics?.totalItemsInspected || 0} items
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Total Inspections</div>
                  <div className="text-2xl font-bold">{qualityMetrics.overallMetrics?.totalInspections || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {qualityMetrics.overallMetrics?.totalItemsInspected || 0} items inspected
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">AI Detection Accuracy</div>
                  <div className="text-2xl font-bold">{qualityMetrics.aiMetrics?.avgAiConfidence || "0"}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on {qualityMetrics.aiMetrics?.totalAiDetections || 0} detections
                  </div>
                </div>
              </>
            )}
            {!qualityMetrics && (
              <>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Overall Defect Rate</div>
                  <div className="text-2xl font-bold">0%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    No quality metrics available
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Total Inspections</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">AI Detection Accuracy</div>
                  <div className="text-2xl font-bold">0%</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts & Metrics */}
        <div className="grid grid-cols-2 gap-6">
          {/* Defect Trend Over Time */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-3">Defect Rate Trend</h3>
            {defectData ? (
              <div className="h-64">
                <Line
                  data={defectData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Defect Rate (%)' }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50">
                <p className="text-gray-500">No defect trend data available</p>
              </div>
            )}
          </div>

          {/* Product Defect Rates */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-3">Defect Rate by Product</h3>
            {productDefectRates ? (
              <div className="h-64">
                <Bar
                  data={productDefectRates}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Defect Rate (%)' }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50">
                <p className="text-gray-500">No product defect data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Defect Types & Inspection Trends */}
        <div className="grid grid-cols-2 gap-6">
          {/* Defect Types Distribution */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-3">Defect Types Distribution</h3>
            {defectResolutionData ? (
              <div className="h-64 flex items-center justify-center">
                <Pie
                  data={defectResolutionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right' },
                      tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw} defects` } }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50">
                <p className="text-gray-500">No defect distribution data available</p>
              </div>
            )}
          </div>

          {/* Monthly Inspection Trend */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-3">Monthly Inspection & Defect Rate Trend</h3>
            {inspectionTrendData ? (
              <div className="h-64">
                <Line
                  data={inspectionTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Inspections' }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Defect Rate (%)' },
                        grid: { drawOnChartArea: false }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50">
                <p className="text-gray-500">No inspection trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          {stats.map((card, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-lg font-semibold">{card.label}</div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm text-gray-500">{card.sub}</div>
              <div className="h-2 bg-gray-200 mt-2 mb-1">
                <div
                  className="h-2 bg-blue-600"
                  style={{ width: card.percent }}
                />
              </div>
              <div className="text-xs text-gray-600">
                {card.percent} Compared to Previous Period
              </div>
            </div>
          ))}
        </div>

        {/* Issues & Upcoming Inspections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Open Issues by Assignee */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-2">Open Issues by Assignee</h3>
            <table className="w-full text-sm">
              <thead className="text-left border-b">
                <tr>
                  <th className="pb-2">Assignee</th>
                  <th className="pb-2">Issues</th>
                  <th className="pb-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {openIssues.length > 0 ? (
                  openIssues.map((person, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{person.name}</td>
                      <td className="py-2">{person.issues}</td>
                      <td className={`py-2 ${person.color}`}>{person.priority}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-500">No open issues</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Upcoming Inspections */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-2">Upcoming Inspections</h3>
            {upcomingInspections.length > 0 ? (
              <ul className="divide-y">
                {upcomingInspections.map((item) => (
                  <li key={item.id} className="py-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm flex justify-between text-gray-500">
                      <span>Batch: {item.batchNumber}</span>
                      <span>{item.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-gray-500">No upcoming inspections</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-2">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <ul className="divide-y">
              {recentActivity.map((act, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <span>{act.text}</span>
                  <span className="text-gray-500 text-xs">{act.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-gray-500">No recent activity</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-4 border-t mt-6">
        <p className="mb-2">
          © 2025 QA Inspection / Terms of Service / Privacy Policy / Contact Us
        </p>
        <div className="flex gap-8 text-xl text-gray-600 justify-center">
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            <FaInstagram />
          </a>
          <a href="https://web.facebook.com/" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            <FaFacebookF />
          </a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-black">
            <FaLinkedinIn />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
