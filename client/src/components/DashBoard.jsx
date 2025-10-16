import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BedDouble,
  Users,
  Wallet,
  Receipt,
  RefreshCcw,
  ExternalLink,
  Percent,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ===================== Helpers ===================== */
const currency = (n) => (n ?? 0).toLocaleString("vi-VN");
const zpad = (n) => String(n).padStart(2, "0");
const ym = (d) => `${d.getFullYear()}-${zpad(d.getMonth() + 1)}`;
const ymd = (d) => `${d.getFullYear()}-${zpad(d.getMonth() + 1)}-${zpad(d.getDate())}`;
const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};
const take = (obj, keys, fallback = []) => {
  for (const k of keys) {
    const v = k.split(".").reduce((o, kk) => (o ? o[kk] : undefined), obj);
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(obj) ? obj : fallback;
};
const normalizeRoomType = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("vip")) return "VIP";
  if (s.includes("thường") || s.includes("normal")) return "Thường";
  return "Khác";
};
const toLocalISOString = (d) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 19).replace("T", " ");
};
const getPaidAt = (inv) => {
  const fields = [inv?.paidAt, inv?.paymentDate, inv?.updatedAt, inv?.createdAt].filter(Boolean);
  return new Date(fields[0] || Date.now());
};
function buildBuckets(timeframe, now = new Date()) {
  const list = [];
  if (timeframe === "day") {
    const base = ymd(now);
    for (let h = 0; h < 24; h++) list.push({ key: `${base} ${zpad(h)}`, label: `${h}h` });
  } else if (timeframe === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      list.push({ key: ymd(d), label: `${zpad(d.getDate())}/${zpad(d.getMonth() + 1)}` });
    }
  } else if (timeframe === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    for (let d = new Date(first); d < next; d.setDate(d.getDate() + 1))
      list.push({ key: ymd(d), label: `${d.getDate()}` });
  } else {
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), qStart + i, 1);
      list.push({ key: ym(d), label: `T${qStart + i + 1}` });
    }
  }
  return list;
}
const bucketKeyForDate = (d, tf) => {
  d = new Date(d);
  if (tf === "day") return `${ymd(d)} ${zpad(d.getHours())}`;
  if (tf === "week" || tf === "month") return ymd(d);
  return ym(d);
};

/* ===================== Component ===================== */
export default function Dashboard({ role = "admin" }) {
  const [timeframe, setTimeframe] = useState("week");
  const [refreshTick, setRefreshTick] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const base = BASE_URL;
        const isStaff = role === "admin" || role === "employee";
        const [rInv, rRooms, rCus] = await Promise.all([
          axios.get(isStaff ? `${base}/toan-bo-hoa-don` : `${base}/xem-hoa-don`, { headers }),
          axios.get(`${base}/tat-ca-phong`, { headers }),
          axios.get(`${base}/tat-ca-khach-hang`, { headers }),
        ]);
        if (!alive) return;
        setInvoices(take(rInv.data, ["invoices", "data.invoices"], []));
        setRooms(take(rRooms.data, ["rooms", "data.rooms"], []));
        setCustomers(take(rCus.data, ["customers", "data.customers"], []));
      } catch (err) {
        console.error("Fetch dashboard data failed:", err);
      }
    })();
    const intv = setInterval(() => setRefreshTick((x) => x + 1), 60000);
    return () => {
      alive = false;
      clearInterval(intv);
    };
  }, [role, token, refreshTick]);

  /* ======= Derived Data ======= */
  const paidInvoices = useMemo(() => invoices.filter(i => i.status === "Đã thanh toán"), [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter(i => i.status !== "Đã thanh toán"), [invoices]);

  const roomStatus = useMemo(() => {
    const visible = rooms.filter(r => !r.isHidden);
    return {
      total: visible.length,
      available: visible.filter(r => r.isAvailable).length,
      occupied: visible.filter(r => !r.isAvailable).length,
    };
  }, [rooms]);

  const timeBuckets = useMemo(() => buildBuckets(timeframe, new Date()), [timeframe]);

  /* ===== Doanh thu và số lượng hóa đơn ===== */
  const revenueSeries = useMemo(() => {
    const map = new Map();
    for (const b of timeBuckets)
      map.set(b.key, { label: b.label, revenue: 0, paid: 0, pending: 0, waiting: 0, total: 0 });
    for (const inv of invoices) {
      const key = bucketKeyForDate(inv.createdAt, timeframe);
      const row = map.get(key);
      if (!row) continue;
      row.total++;
      if (inv.status === "Đã thanh toán") {
        row.paid++;
        row.revenue += inv.totalAmount || 0;
      } else if (inv.status === "Chờ thanh toán") row.pending++;
      else row.waiting++;
    }
    return Array.from(map.values());
  }, [invoices, timeframe, timeBuckets]);

  const revenueThisView = revenueSeries.reduce((sum, r) => sum + r.revenue, 0);
  const allZero = revenueSeries.every(r => !r.revenue && !r.total);

  /* ===== Phân loại VIP vs Thường ===== */
  const vipNormalPie = useMemo(() => {
    let vip = 0, normal = 0, other = 0;
    for (const inv of invoices) {
      const key = bucketKeyForDate(new Date(inv.createdAt), timeframe);
      if (!timeBuckets.find(b => b.key === key)) continue;
      const type = normalizeRoomType(inv?.roomId?.roomType);
      if (type === "VIP") vip++;
      else if (type === "Thường") normal++;
      else other++;
    }
    const total = vip + normal + other || 1;
    return {
      data: [
        { name: "VIP", value: vip },
        { name: "Thường", value: normal },
        ...(other ? [{ name: "Khác", value: other }] : []),
      ],
      percentText: `VIP ${Math.round((vip / total) * 100)}% · Thường ${Math.round((normal / total) * 100)}%`,
    };
  }, [invoices, timeframe, timeBuckets]);

  /* ===== Doanh thu 6 tháng ===== */
  const last6Months = useMemo(() => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    const map = new Map();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(base.getFullYear(), base.getMonth() - k, 1);
      map.set(ym(d), 0);
    }
    for (const inv of paidInvoices) {
      const key = ym(getPaidAt(inv));
      if (map.has(key)) map.set(key, map.get(key) + (inv.totalAmount || 0));
    }
    return Array.from(map.entries()).map(([m, v]) => ({ month: m, revenue: v }));
  }, [paidInvoices]);

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5),
    [invoices]
  );

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-100 text-gray-800">
      <header className="sticky top-15 z-30 backdrop-blur bg-white/80 border-b border-sky-100">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-sky-700">DASHBOARD</h1>
            <p className="text-sm text-gray-500">
              {greet()}, {role === "admin" ? "Admin" : role === "employee" ? "Nhân viên" : "Khách"} ·{" "}
              {new Date().toLocaleString("vi-VN")} · {refreshTick}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-xl border bg-white/90 px-3 py-1.5 text-sm shadow-sm focus:ring-2 focus:ring-sky-400"
            >
              <option value="day">Trong ngày</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
            </select>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border px-3 py-1.5 text-sm shadow-sm hover:bg-sky-50 flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Tổng số phòng" value={roomStatus.total} sub={`${roomStatus.available} trống · ${roomStatus.occupied} thuê`} icon={<BedDouble />} />
          <StatCard title="Khách hàng" value={customers.length} sub={`Mới tháng này: ${customers.filter(c => new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length}`} icon={<Users />} />
          <StatCard title={`Doanh thu (${timeframe})`} value={`${currency(revenueThisView)} ₫`} sub="Đã thanh toán trong khung" icon={<Wallet />} />
          <StatCard title="Hóa đơn đang chờ" value={pendingInvoices.length} sub="Chờ xác nhận / thanh toán" icon={<Receipt />} />
        </section>

        {/* Revenue + Pie */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ doanh thu */}
          <div className="col-span-2 rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sky-700">
                Doanh thu và số lượng hóa đơn ({timeframe === "day" ? "theo giờ" : "từng ngày"})
              </h3>
              <button
                onClick={() => exportCSVForRevenue(revenueSeries, timeframe)}
                className="text-xs rounded-lg border px-3 py-1.5 hover:bg-sky-50 flex items-center gap-1"
              >
                <Download size={14} /> Xuất CSV
              </button>
            </div>

            {allZero ? (
              <div className="h-72 flex items-center justify-center text-gray-500 text-sm">
                Không có dữ liệu trong khung
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" />
                    <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `${v / 1_000_000}M`} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                    <Tooltip
                      formatter={(v, n) =>
                        n === "Doanh thu (₫)" ? `${currency(v)} ₫` : `${v} hóa đơn`
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Doanh thu (₫)"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="total"
                      name="Tổng HĐ"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Biểu đồ VIP vs Thường */}
          <div className="rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md">
            <h3 className="font-semibold mb-2 text-sky-700">Phòng được đặt (VIP vs Thường)</h3>
            <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
              <Percent size={14} /> {vipNormalPie.percentText}
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vipNormalPie.data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                    {vipNormalPie.data.map((_, i) => (
                      <Cell key={i} fill={["#2563eb", "#10b981", "#f59e0b"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Bảng tổng hợp hóa đơn */}
        <section className="mt-8 rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md">
          <h3 className="font-semibold mb-4 text-sky-700">Tổng hợp hóa đơn</h3>
           <button
              onClick={() => exportCSVForSummary(revenueSeries, timeframe, revenueThisView)}
              className="text-xs mb-3 cursor-pointer rounded-lg border px-3 py-1.5 hover:bg-sky-50 flex items-center gap-1"
            >
              <Download size={14} /> Xuất CSV
            </button>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-sky-50 text-gray-700">
                <tr>
                  <th className="py-2 px-3 text-left">Thời điểm</th>
                  <th className="py-2 px-3 text-center">Tổng HĐ</th>
                  <th className="py-2 px-3 text-center text-emerald-700">Đã TT</th>
                  <th className="py-2 px-3 text-center text-amber-700">Chờ TT</th>
                  <th className="py-2 px-3 text-center text-gray-700">Chờ xác nhận</th>
                  <th className="py-2 px-3 text-right text-sky-700">Doanh thu (₫)</th>
                </tr>
              </thead>
              <tbody>
                {revenueSeries.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-sky-50">
                    <td className="py-2 px-3">{r.label}</td>
                    <td className="py-2 px-3 text-center">{r.total}</td>
                    <td className="py-2 px-3 text-center text-emerald-700">{r.paid}</td>
                    <td className="py-2 px-3 text-center text-amber-700">{r.pending}</td>
                    <td className="py-2 px-3 text-center">{r.waiting}</td>
                    <td className="py-2 px-3 text-right font-semibold text-sky-700">
                      {currency(r.revenue)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-sky-100 font-semibold">
                  <td className="py-2 px-3 text-right">Tổng cộng:</td>
                  <td className="py-2 px-3 text-center">
                    {revenueSeries.reduce((a, r) => a + r.total, 0)}
                  </td>
                  <td className="py-2 px-3 text-center text-emerald-700">
                    {revenueSeries.reduce((a, r) => a + r.paid, 0)}
                  </td>
                  <td className="py-2 px-3 text-center text-amber-700">
                    {revenueSeries.reduce((a, r) => a + r.pending, 0)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {revenueSeries.reduce((a, r) => a + r.waiting, 0)}
                  </td>
                  <td className="py-2 px-3 text-right text-sky-700">
                    {currency(revenueThisView)} ₫
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Hóa đơn gần đây */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sky-700">Hóa đơn gần đây</h3>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="text-sm text-gray-500">Chưa có dữ liệu</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b text-gray-600">
                      <th className="py-2 pr-4">Mã</th>
                      <th className="py-2 pr-4">Khách</th>
                      <th className="py-2 pr-4">SĐT</th>
                      <th className="py-2 pr-4">Tổng (₫)</th>
                      <th className="py-2 pr-4">Trạng thái</th>
                      <th className="py-2">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((iv) => (
                      <tr key={iv._id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">
                          #{String(iv._id).slice(-6).toUpperCase()}
                        </td>
                        <td className="py-2 pr-4">{iv.customerId?.name || "—"}</td>
                        <td className="py-2 pr-4">{iv.customerId?.phone || "—"}</td>
                        <td className="py-2 pr-4">{currency(iv.totalAmount)}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={
                              "text-xs font-semibold px-2 py-1 rounded-full " +
                              (iv.status === "Đã thanh toán"
                                ? "bg-emerald-100 text-emerald-700"
                                : iv.status === "Chờ thanh toán"
                                ? "bg-amber-100 text-amber-700"
                                : iv.status === "Chờ xác nhận"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-rose-100 text-rose-700")
                            }
                          >
                            {iv.status}
                          </span>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => window.open(`/chi-tiet-hoa-don/${iv._id}`, "_blank")}
                            className="text-xs rounded-lg border px-2.5 py-1 hover:bg-sky-50 inline-flex items-center gap-1"
                          >
                            <ExternalLink size={14} /> Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Doanh thu 6 tháng */}
          <div className="rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md">
            <h3 className="font-semibold mb-4 text-sky-700">Doanh thu 6 tháng gần đây</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${currency(v)} ₫`} />
                  <Bar dataKey="revenue" fill="#2563eb" name="Tổng tiền" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Khách sạn Nhớ Một Người
        </footer>
      </main>
    </div>
  );
}

/* ===================== Sub-components ===================== */
function StatCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-2xl border bg-white/90 p-4 md:p-6 shadow-md hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <div className="mt-1 text-2xl font-bold tracking-tight text-sky-700">{value ?? "—"}</div>
          {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
        </div>
        <div className="p-2 rounded-xl bg-sky-50 text-sky-700">{icon}</div>
      </div>
    </div>
  );
}

function exportCSVForRevenue(series, timeframe) {
  if (!series?.length) return;
  const head = ["Thời điểm", "Tổng HĐ", "Doanh thu (₫)"];
  const rows = series.map((r) => [r.label, r.total, r.revenue]);
  const csv = [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(csv, `revenue_${timeframe}`);
}

function exportCSVForSummary(series, timeframe, totalRevenue) {
  if (!series?.length) return;
  const head = ["Thời điểm", "Tổng HĐ", "Đã TT", "Chờ TT", "Chờ xác nhận", "Doanh thu (₫)"];
  const rows = series.map((r) => [r.label, r.total, r.paid, r.pending, r.waiting, r.revenue]);
  rows.push([
    "Tổng cộng",
    series.reduce((a, r) => a + r.total, 0),
    series.reduce((a, r) => a + r.paid, 0),
    series.reduce((a, r) => a + r.pending, 0),
    series.reduce((a, r) => a + r.waiting, 0),
    totalRevenue,
  ]);
  const csv = [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(csv, `invoice_summary_${timeframe}`);
}

function downloadCSV(content, name) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
