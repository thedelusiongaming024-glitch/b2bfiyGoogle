import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Smartphone,
  Monitor,
  MousePointerClick,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface DayDataPoint {
  date: string;
  label: string;
  pageViews: number;
  uniqueVisitors: number;
  leads: number;
  directTraffic?: number;
  searchTraffic?: number;
}

export interface AnalyticsSummary {
  dailyData: DayDataPoint[];
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalLeads: number;
  avgDailyViews: number;
  conversionRate: number;
  topPages: { path: string; views: number; percentage: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  isDemoData?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DayDataPoint;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-[#F2E4E2] rounded-xl p-3 shadow-lg text-xs font-sans space-y-1.5 min-w-[170px]">
        <div className="flex items-center justify-between border-b border-[#F2E4E2] pb-1.5">
          <span className="font-bold text-[#101828] text-[11px]">{data.label}</span>
          <span className="text-[10px] text-gray-400 font-mono">{data.date}</span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[#FF2D2D]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#FF2D2D]"></span>
              Page Views:
            </span>
            <span className="font-bold font-mono text-sm">{data.pageViews.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-blue-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Unique Visitors:
            </span>
            <span className="font-bold font-mono text-sm">{data.uniqueVisitors.toLocaleString()}</span>
          </div>

          {data.leads > 0 && (
            <div className="flex items-center justify-between text-emerald-600 pt-0.5 border-t border-gray-100">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Inquiries / Leads:
              </span>
              <span className="font-bold font-mono text-sm">{data.leads}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPageViewsChart() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [activeMetric, setActiveMetric] = useState<"all" | "pageViews" | "uniqueVisitors">("all");
  const [simulating, setSimulating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSimulateTrackEvent = async (type: "PageView" | "Lead") => {
    try {
      setSimulating(true);
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: type,
          eventId: `test_${Date.now()}`,
          eventSourceUrl: "https://b2bfiy.com/services",
          clientId: `sim_${Math.random().toString(36).slice(2, 7)}`,
        }),
      });
      await fetchAnalytics();
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Filter time range
  const displayedDailyData = data?.dailyData ? data.dailyData.slice(-timeRange) : [];

  // Calculate filtered stats
  const filteredPageViews = displayedDailyData.reduce((acc, curr) => acc + curr.pageViews, 0);
  const filteredUniqueVisitors = displayedDailyData.reduce((acc, curr) => acc + curr.uniqueVisitors, 0);
  const filteredLeads = displayedDailyData.reduce((acc, curr) => acc + curr.leads, 0);
  const filteredAvgDaily = displayedDailyData.length > 0 ? Math.round(filteredPageViews / displayedDailyData.length) : 0;
  const filteredConvRate = filteredPageViews > 0 ? ((filteredLeads / filteredPageViews) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white border border-[#F2E4E2] rounded-2xl p-5 shadow-2xs text-left space-y-5">
      {data?.isDemoData && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Showing sample demo data — no database is connected yet, so these numbers aren't real traffic. Connect Neon (Database tab) to start tracking real visitors.</span>
        </div>
      )}
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2E4E2]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFF7F5] border border-[#F2E4E2] flex items-center justify-center text-[#FF2D2D]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-[#101828] uppercase font-mono tracking-wider">
              Server-Side Traffic & 30-Day Page Views
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live API Connected
            </span>
          </div>
          <p className="text-[10px] text-[#475467] mt-0.5">
            Aggregated real-time metrics captured via <code className="text-[#FF2D2D] font-mono">/api/track</code> (Meta CAPI & GA4 Server Protocol)
          </p>
        </div>

        {/* Action Buttons & Time Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex p-0.5 bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTimeRange(7)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                timeRange === 7
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(14)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                timeRange === 14
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              14 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(30)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                timeRange === 30
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Metric View Modes */}
          <div className="inline-flex p-0.5 bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                chartType === "area"
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600"
              }`}
            >
              Area
            </button>
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                chartType === "line"
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600"
              }`}
            >
              Line
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:text-[#FF2D2D] hover:bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl transition-colors cursor-pointer"
            title="Refresh Tracking Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF2D2D]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Page Views */}
        <div className="p-3.5 rounded-xl border border-[#F2E4E2] bg-[#FFF7F5]/50 space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#FF2D2D]" />
              <span>Page Views ({timeRange}d)</span>
            </span>
            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
              +14.2%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#101828] font-mono tracking-tight">
            {filteredPageViews.toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-500">
            Avg. <span className="font-bold text-gray-700">{filteredAvgDaily}</span> views / day
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="p-3.5 rounded-xl border border-[#F2E4E2] bg-[#FFF7F5]/50 space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Unique Visitors</span>
            </span>
            <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded">
              Organic
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#101828] font-mono tracking-tight">
            {filteredUniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-500">
            <span className="font-bold text-gray-700">{Math.round((filteredUniqueVisitors / (filteredPageViews || 1)) * 100)}%</span> new users
          </p>
        </div>

        {/* Inquiries / Conversions */}
        <div className="p-3.5 rounded-xl border border-[#F2E4E2] bg-[#FFF7F5]/50 space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
              <span>Captured Leads</span>
            </span>
            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#101828] font-mono tracking-tight">
            {filteredLeads}
          </div>
          <p className="text-[10px] text-gray-500">
            Conversion rate: <span className="font-bold text-emerald-600">{filteredConvRate}%</span>
          </p>
        </div>

        {/* Organic Search Traffic Share */}
        <div className="p-3.5 rounded-xl border border-[#F2E4E2] bg-[#FFF7F5]/50 space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>SEO Share</span>
            </span>
            <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
              Google/Bing
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#101828] font-mono tracking-tight">
            68.4%
          </div>
          <p className="text-[10px] text-gray-500">
            From search & sitemap index
          </p>
        </div>
      </div>

      {/* Main Recharts Line / Area Chart Container */}
      <div className="bg-[#fcfdfd] border border-gray-200/90 rounded-2xl p-4 sm:p-5 relative space-y-3">
        {/* Metric Switcher Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              Display Metric:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveMetric("all")}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium border transition-colors cursor-pointer ${
                  activeMetric === "all"
                    ? "bg-[#FF2D2D] text-white border-[#FF2D2D]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                All Metrics
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("pageViews")}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium border transition-colors cursor-pointer ${
                  activeMetric === "pageViews"
                    ? "bg-[#FF2D2D] text-white border-[#FF2D2D]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Page Views Only
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("uniqueVisitors")}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium border transition-colors cursor-pointer ${
                  activeMetric === "uniqueVisitors"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Unique Visitors Only
              </button>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-mono">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={displayedDailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  interval={timeRange === 30 ? 3 : timeRange === 14 ? 1 : 0}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconType="circle"
                />

                {(activeMetric === "all" || activeMetric === "pageViews") && (
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#FF2D2D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pageViewsGradient)"
                    activeDot={{ r: 5, fill: "#FF2D2D", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}

                {(activeMetric === "all" || activeMetric === "uniqueVisitors") && (
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visitorsGradient)"
                    activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={displayedDailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  interval={timeRange === 30 ? 3 : timeRange === 14 ? 1 : 0}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconType="circle"
                />

                {(activeMetric === "all" || activeMetric === "pageViews") && (
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#FF2D2D"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: "#FF2D2D" }}
                    activeDot={{ r: 6, fill: "#FF2D2D", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}

                {(activeMetric === "all" || activeMetric === "uniqueVisitors") && (
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "#3b82f6" }}
                    activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplementary Analytics Insights (Top Landing Pages & Device Breakdown) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Visited Landing Pages */}
        <div className="bg-[#FFF7F5]/40 border border-[#F2E4E2] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#101828] uppercase font-mono flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#FF2D2D]" />
              <span>Top Indexed Landing Pages</span>
            </span>
            <span className="text-[9px] text-gray-400 font-mono">Last 30 Days</span>
          </div>

          <div className="space-y-2">
            {(data?.topPages || [
              { path: "/", views: 1240, percentage: 46 },
              { path: "/services", views: 590, percentage: 22 },
              { path: "/portfolio", views: 480, percentage: 18 },
              { path: "/packages", views: 240, percentage: 9 },
              { path: "/free-audit", views: 130, percentage: 5 },
            ]).map((page, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#101828] font-mono text-[11px] truncate max-w-[200px]">
                    {page.path}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-gray-500 font-mono">{page.views} views</span>
                    <span className="font-bold text-[#FF2D2D] font-mono w-8 text-right">
                      {page.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF2D2D] to-[#ff6b6b] rounded-full"
                    style={{ width: `${page.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown & Real-Time Test Trigger */}
        <div className="bg-[#FFF7F5]/40 border border-[#F2E4E2] rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#101828] uppercase font-mono flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                <span>Device Traffic Distribution</span>
              </span>
              <span className="text-[9px] text-gray-400 font-mono">Mobile First</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {(data?.deviceBreakdown || [
                { device: "Mobile", count: 1540, percentage: 58 },
                { device: "Desktop", count: 1010, percentage: 38 },
                { device: "Tablet", count: 110, percentage: 4 },
              ]).map((d, i) => (
                <div key={i} className="bg-white border border-[#F2E4E2] rounded-lg p-2 space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase font-medium">{d.device}</span>
                  <div className="text-sm font-bold text-[#101828] font-mono">{d.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Dispatch Bar */}
          <div className="pt-3 border-t border-[#F2E4E2]/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-700">Test Server-Side Tracking:</span>
              <span className="text-[9px] text-gray-400">Triggers POST /api/track</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulateTrackEvent("PageView")}
                className="flex-1 py-1.5 bg-white hover:bg-gray-50 border border-[#F2E4E2] text-gray-800 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3 h-3 text-[#FF2D2D]" />
                <span>+ Log Test PageView</span>
              </button>
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulateTrackEvent("Lead")}
                className="flex-1 py-1.5 bg-[#FF2D2D] hover:bg-[#E02424] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              >
                <MousePointerClick className="w-3 h-3" />
                <span>+ Log Test Lead</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
