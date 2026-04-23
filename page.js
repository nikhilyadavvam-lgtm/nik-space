"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import API from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminAuth, setAdminAuth] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("tags");
  
  // Advanced States
  const [shopkeepers, setShopkeepers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [settingsForm, setSettingsForm] = useState({ tagPrice: 100, stickerPriceText: "2 stickers at 59 rupees" });
  const [messagingChannel, setMessagingChannel] = useState("httpsms");
  const [channelSaving, setChannelSaving] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", maxUses: 10, discountPercent: 100 });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Bulk QR states
  const [bulkEmail, setBulkEmail] = useState("");
  const [bulkAccountInfo, setBulkAccountInfo] = useState(null);
  const [bulkAccountLoading, setBulkAccountLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState(null);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    customId: "",
    category: "PERSONAL_ITEM",
    name: "",
    location: "",
    phone: "",
    emergencyPhone: "",
    info: "",
    emergencyInfo: "",
    cleanerName: "",
    lastCleaningDate: "",
    nextCleaningDate: "",
    tds: "",
    lastRoFilterChangeDate: "",
    nextRoFilterChangeDate: "",
    phonePrivacyMode: "private",
    shopTiming: "",
    shopDescription: "",
  });

  const [tags, setTags] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Offline Sales States
  const [unassignedCount, setUnassignedCount] = useState(10);
  const [unassignedCategory, setUnassignedCategory] = useState("PERSONAL_ITEM");
  const [unassignedLoading, setUnassignedLoading] = useState(false);

  const [assignForm, setAssignForm] = useState({ customId: "", customerEmail: "" });
  const [assignLoading, setAssignLoading] = useState(false);

  // Verify admin session on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await API.get("/admin/me");
        if (res.data.success) {
          setAdminAuth(true);
        }
      } catch {
        setAdminAuth(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAdmin();
  }, []);

  // Fetch all admin data when authenticated
  useEffect(() => {
    if (!adminAuth) return;
    const fetchAdminData = async () => {
      try {
        const [statsRes, tagsRes, ordersRes, usersRes, skRes, settingsRes, couponsRes] = await Promise.all([
          API.get("/admin/stats"),
          API.get("/admin/tags"),
          API.get("/admin/orders"),
          API.get("/admin/users"),
          API.get("/admin/shopkeepers"),
          API.get("/admin/settings"),
          API.get("/admin/coupons"),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (tagsRes.data.success) setTags(tagsRes.data.data);
        if (ordersRes.data.success) setOrders(ordersRes.data.data);
        if (usersRes.data.success) setUsers(usersRes.data.data); // Fixed typo here
        if (skRes.data.success) setShopkeepers(skRes.data.data);
        if (settingsRes.data.success) {
          setSettings(settingsRes.data.data);
          setSettingsForm({
            tagPrice: settingsRes.data.data.tagPrice,
            stickerPriceText: settingsRes.data.data.stickerPriceText,
          });
          setMessagingChannel(settingsRes.data.data.messagingChannel || "httpsms");
        }
        if (couponsRes.data.success) setCoupons(couponsRes.data.data);
      } catch (err) {
        console.error("Admin fetch error:", err);
      }
    };
    fetchAdminData();
  }, [adminAuth]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await API.post("/admin/login", loginForm);
      if (res.data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem("admin_token", res.data.token);
        }
        setAdminAuth(true);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await API.post("/admin/logout");
      setAdminAuth(false);
      router.push("/");
    } catch {}
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/admin/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
        alert("Order status updated.");
      }
    } catch {
      alert("Failed to update order status.");
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm("Delete this tag permanently?")) return;
    try {
      const res = await API.delete(`/admin/tags/${tagId}`);
      if (res.data.success) {
        setTags(prev => prev.filter(t => t._id !== tagId));
        alert("Tag deleted.");
      }
    } catch {
      alert("Failed to delete tag.");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await API.put("/admin/settings", settingsForm);
      if (res.data.success) {
        setSettings(res.data.data);
        alert("Platform settings synchronized.");
      }
    } catch {
      alert("Failed to update settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const res = await API.post("/admin/coupons", couponForm);
      if (res.data.success) {
        setCoupons([res.data.data, ...coupons]);
        setCouponForm({ code: "", maxUses: 10, discountPercent: 100 });
        alert("Promotion coupon created!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Remove this promotion coupon?")) return;
    try {
      const res = await API.delete(`/admin/coupons/${id}`);
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id));
        alert("Coupon removed.");
      }
    } catch {
      alert("Failed to delete coupon.");
    }
  };

  const handleToggleApproval = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'revoke' : 'approve'} this shopkeeper?`)) return;
    try {
      const res = await API.put(`/admin/shopkeepers/${id}/approve`, {
        isApproved: !currentStatus
      });
      if (res.data.success) {
        setShopkeepers(prev => prev.map(sk => sk._id === id ? { ...sk, isApproved: !currentStatus } : sk));
        alert(`Shopkeeper ${!currentStatus ? 'approved' : 'revoked'} successfully.`);
      }
    } catch {
      alert("Failed to update status.");
    }
  };

  // Bulk QR Handlers
  const handleBulkLookup = async () => {
    if (!bulkEmail.trim()) return;
    setBulkAccountLoading(true);
    try {
      const res = await API.get(`/admin/bulk-qr/stats?email=${encodeURIComponent(bulkEmail.trim())}`);
      if (res.data.success) setBulkAccountInfo(res.data.data);
    } catch (err) {
      setBulkMessage({ type: "error", text: "User not found." });
    } finally {
      setBulkAccountLoading(false);
    }
  };

  const handleBulkGenerateId = async () => {
    try {
      const res = await API.post("/admin/bulk-qr/generate-id");
      if (res.data.success) {
        setBulkForm({ ...bulkForm, customId: res.data.customId });
      }
    } catch {
      alert("Failed to generate ID");
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (!bulkEmail.trim()) return;
    setBulkCreating(true);
    try {
      const res = await API.post("/admin/bulk-qr/create", {
        email: bulkEmail.trim(),
        ...bulkForm,
      });
      if (res.data.success) {
        setBulkMessage({ type: "success", text: "Tag created successfully!" });
        setBulkForm({
          ...bulkForm,
          customId: "",
          name: "",
          location: "",
          info: "",
          cleanerName: "",
          tds: "",
          lastCleaningDate: "",
          nextCleaningDate: "",
          lastRoFilterChangeDate: "",
          nextRoFilterChangeDate: "",
          shopTiming: "",
          shopDescription: "",
        });
        handleBulkLookup();
      }
    } catch (err) {
      setBulkMessage({ type: "error", text: err.response?.data?.message || "Failed to create tag." });
    } finally {
      setBulkCreating(false);
    }
  };

  const handleGenerateUnassigned = async (e) => {
    e.preventDefault();
    setUnassignedLoading(true);
    try {
      const res = await API.post("/admin/bulk-qr/generate-unassigned", {
        count: unassignedCount,
        category: unassignedCategory
      });
      if (res.data.success) {
        alert(res.data.message);
        // Generate CSV and trigger download
        const headers = ["Sr No", "Custom ID", "Passcode", "QR Image Link"];
        const rows = res.data.data.map(t => [t.srNo, t.customId, t.passcode, t.qrImageUrl]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `unassigned_tags_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate tags.");
    } finally {
      setUnassignedLoading(false);
    }
  };

  const handleAssignEmail = async (e) => {
    e.preventDefault();
    if (!assignForm.customId || !assignForm.customerEmail) return;
    setAssignLoading(true);
    try {
      const res = await API.post("/admin/bulk-qr/assign-email", assignForm);
      if (res.data.success) {
        alert("Tag correctly assigned to user email!");
        setAssignForm({ customId: "", customerEmail: "" });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign email.");
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 rounded-2xl border-4 border-yellow-200 border-t-yellow-500 animate-spin"></div>
    </div>
  );

  if (!adminAuth) return (
    <Layout>
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
        <div className="mm-card-lg p-10 max-w-sm w-full shadow-2xl shadow-gray-200 border-0">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-dark-blue rounded-4xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
              <i className="ri-admin-fill text-4xl text-yellow-400"></i>
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Central Admin</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Secure Access Required</p>
          </div>
          
          {loginError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold mb-6 flex items-center gap-2 tracking-wide"><i className="ri-error-warning-fill text-base"></i> {loginError}</div>}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Email</label>
              <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="input-mm py-2!" placeholder="admin@jankaritag.com" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secret Key</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="input-mm py-2!" placeholder="••••••••" required />
            </div>
            <button disabled={loginLoading} className="btn-mm btn-mm-primary w-full h-16 font-black tracking-[0.2em] shadow-xl shadow-yellow-400/20 uppercase text-xs">
              {loginLoading ? "Verifying..." : "Authorized Entry"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Stats */}
          <div className="bg-dark-blue rounded-4xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <i className="ri-shield-user-fill text-[180px]"></i>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center text-dark-blue shadow-lg">
                    <i className="ri-settings-4-fill text-3xl"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none mb-2">Admin Panel</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Operational Intelligence & Data Management</p>
                  </div>
               </div>
               <button onClick={handleAdminLogout} className="px-6 py-3 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10">Terminate Session</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mt-12 relative z-10">
               {[
                 { label: "Active Tags", val: stats?.totalTags || 0, icon: "ri-broadcast-line", color: "text-green-400" },
                 { label: "Total Members", val: stats?.totalUsers || 0, icon: "ri-user-heart-fill", color: "text-blue-400" },
                 { label: "Printed JTags", val: stats?.totalJTags || 0, icon: "ri-sticky-note-fill", color: "text-orange-400" },
                 { label: "Live QR Codes", val: stats?.totalQRCodes || 0, icon: "ri-qr-code-fill", color: "text-cyan-400" },
                 { label: "Paid Orders", val: stats?.totalOrders || 0, icon: "ri-shopping-cart-2-fill", color: "text-purple-400" },
                 { label: "Shopkeepers", val: shopkeepers.length, icon: "ri-store-2-fill", color: "text-yellow-400" },
                 { label: "Revenue", val: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: "ri-money-rupee-circle-fill", color: "text-emerald-400" },
                 { label: "Stickers", val: stats?.totalStickers || 0, icon: "ri-award-fill", color: "text-pink-400" }
               ].map((s, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                   <div className="flex items-center gap-2 mb-1.5 opacity-70">
                     <i className={`${s.icon} text-[10px]`}></i>
                     <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                   </div>
                   <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
             {[
               { id: "tags", label: "My Registry", icon: "ri-list-check-3" },
               { id: "bulkqr", label: "Bulk QR", icon: "ri-cpu-line" },
               { id: "orders", label: "Customer Orders", icon: "ri-truck-line" },
               { id: "shopkeepers", label: "Shop Partners", icon: "ri-store-2-line" },
               { id: "users", label: "User Directory", icon: "ri-team-line" },
               { id: "settings", label: "Admin Settings", icon: "ri-settings-4-line" },
               { id: "coupons", label: "Sale Coupons", icon: "ri-coupon-3-line" }
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center gap-2.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${activeTab === t.id ? 'bg-dark-blue text-white border-dark-blue shadow-lg shadow-blue-900/20' : 'bg-white text-gray-400 border-gray-100 hover:border-dark-blue/20 hover:text-gray-900'}`}
               >
                 <i className={`${t.icon} text-sm`}></i> {t.label}
               </button>
             ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
             {activeTab === "tags" && (
               <div className="mm-card-lg overflow-hidden border-0 bg-white">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Active Asset Registry</h3>
                    <div className="relative">
                      <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter Node ID..." className="input-mm pl-12! py-3! w-64!" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
                         <tr>
                           <th className="px-8 py-5">Custom ID</th>
                           <th className="px-8 py-5">Category</th>
                           <th className="px-8 py-5">Owner Name</th>
                           <th className="px-8 py-5">Metadata Status</th>
                           <th className="px-8 py-5 text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {tags.filter(t => t.customId.includes(search)).slice(0, 50).map((tag, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-8 py-6">
                                  <span className="font-mono font-black text-gray-900 text-sm whitespace-nowrap bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">#{tag.customId}</span>
                               </td>
                               <td className="px-8 py-6 italic font-bold text-xs text-gray-500">{tag.category}</td>
                               <td className="px-8 py-6 font-black text-gray-900 text-sm">{tag.name || "UNREGISTERED"}</td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${tag.imgurl ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></div>
                                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tag.imgurl ? 'Synchronized' : 'Pending Upload'}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <button onClick={() => router.push(`/data?id=${tag.customId}`)} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:bg-dark-blue hover:text-white transition-all flex items-center justify-center ml-auto">
                                     <i className="ri-external-link-line"></i>
                                  </button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
             )}

          {activeTab === "bulkqr" && (
  <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
    {/* NEW OFFLINE SALES BULK SECTION */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. Generate Retail (Passcode) Tags */}
      <div className="mm-card-lg p-6 bg-white shadow-lg border-2 border-dashed border-gray-200">
        <h3 className="text-xl font-black mb-4 tracking-tight flex items-center gap-3">
          <i className="ri-coupon-3-fill text-pink-500"></i> Auto-Generate Retail QRs (CSV)
        </h3>
        <p className="text-xs text-gray-400 font-bold mb-6">Generates unassigned tags with passcodes and instantly downloads an Excel/CSV sheet for manufacturing.</p>
        
        <form onSubmit={handleGenerateUnassigned} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Quantity</label>
            <input type="number" value={unassignedCount} onChange={e => setUnassignedCount(e.target.value)} min="1" max="500" className="input-mm py-2 text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Default Category</label>
            <select value={unassignedCategory} onChange={e => setUnassignedCategory(e.target.value)} className="input-mm py-2 text-sm font-bold">
              <option value="PERSONAL_ITEM">Personal Item</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="WATER_COOLER">Water Cooler</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <button disabled={unassignedLoading} className="btn-mm bg-pink-500 hover:bg-pink-600 text-white w-full h-12 text-sm font-black tracking-widest uppercase">
            {unassignedLoading ? "Processing..." : "Generate & Download CSV"}
          </button>
        </form>
      </div>

      {/* 2. Assign Email to Unassigned Tag */}
      <div className="mm-card-lg p-6 border-0 bg-white shadow-lg">
        <h3 className="text-xl font-black mb-4 tracking-tight flex items-center gap-3">
          <i className="ri-mail-send-fill text-indigo-500"></i> Assign Retail Tag to Email
        </h3>
        <p className="text-xs text-gray-400 font-bold mb-6">If a customer doesn't know how to use the passcode, assign the tag manually to their email here.</p>
        
        <form onSubmit={handleAssignEmail} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Tag Custom ID</label>
            <input value={assignForm.customId} onChange={e => setAssignForm({...assignForm, customId: e.target.value})} className="input-mm py-2 text-sm font-mono uppercase" placeholder="BLK-XXXXX" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Customer Email</label>
            <input type="email" value={assignForm.customerEmail} onChange={e => setAssignForm({...assignForm, customerEmail: e.target.value})} className="input-mm py-2 text-sm text-indigo-600 font-bold lowercase" placeholder="farmer@village.com" required />
          </div>
          <button disabled={assignLoading} className="btn-mm bg-indigo-500 hover:bg-indigo-600 text-white w-full h-12 text-sm font-black tracking-widest uppercase">
            {assignLoading ? "Assigning..." : "Assign Tag Seamlessly"}
          </button>
        </form>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      <div className="xl:col-span-2 mm-card-lg p-6 border-0 bg-white">
        <h3 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3">
          <i className="ri-qr-scan-2-line text-yellow-500"></i> Direct Assignment Generation
        </h3>

      <form onSubmit={handleBulkCreate} className="space-y-6">
        {/* Section 1: Access & Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-dark-blue text-white text-[10px] font-black flex items-center justify-center">01</span>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400">Access & Identity</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Account Synchronization (Email)</label>
              <div className="flex gap-2">
                <input type="email" value={bulkEmail} onChange={e => setBulkEmail(e.target.value)} className="input-mm py-2 text-sm" placeholder="partner@jankaritag.com" required />
                <button type="button" onClick={handleBulkLookup} className="btn-mm bg-dark-blue text-white px-3 text-[10px] font-black tracking-widest">Verify</button>
              </div>
              {bulkAccountInfo && <p className="text-[9px] font-semibold text-emerald-500 ml-1 tracking-wide">Confirmed: {bulkAccountInfo.user?.name} ({bulkAccountInfo.tagCount} Tags)</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Custom ID</label>
              <div className="flex gap-2">
                <input value={bulkForm.customId} onChange={e => setBulkForm({...bulkForm, customId: e.target.value})} className="input-mm font-mono py-2 text-sm" placeholder="TAG-XXXX-XXXX" required />
                <button type="button" onClick={handleBulkGenerateId} className="btn-mm bg-yellow-400 text-dark-blue px-3 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all"><i className="ri-magic-line text-lg"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Asset Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-dark-blue text-white text-[10px] font-black flex items-center justify-center">02</span>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400">Asset Profile</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Classification (Category)</label>
              <select value={bulkForm.category} onChange={e => setBulkForm({...bulkForm, category: e.target.value})} className="input-mm py-2 text-sm font-bold appearance-none cursor-pointer">
                <optgroup label="Institutional">
                  <option value="WATER_COOLER">Water Cooler / Tank</option>
                  <option value="AIR_CONDITIONER">Air Conditioner</option>
                  <option value="LAB_EQUIPMENT">Lab Equipment</option>
                  <option value="SCHOOL_ASSET">General School Asset</option>
                  <option value="BUS">Transport / Bus</option>
                </optgroup>
                <optgroup label="Personal / Commercial">
                  <option value="VEHICLE">Private Vehicle</option>
                  <option value="SHOPS">Business / Shop</option>
                  <option value="PERSONAL_ITEM">Personal Item</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="SUITCASE">Travel Suitcase</option>
                  <option value="OTHER">Other / Misc</option>
                </optgroup>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Asset Designation (Name)</label>
              <input value={bulkForm.name} onChange={e => setBulkForm({...bulkForm, name: e.target.value})} className="input-mm py-2 text-sm" placeholder="e.g. Tank A-01, Scorpio N" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Deployment (Location)</label>
              <input value={bulkForm.location} onChange={e => setBulkForm({...bulkForm, location: e.target.value})} className="input-mm py-2 text-sm" placeholder="e.g. Block C, Parking 4" />
            </div>
          </div>
        </div>

        {/* Section 3: Connectivity & Privacy */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-dark-blue text-white text-[10px] font-black flex items-center justify-center">03</span>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400">Connectivity & Privacy</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Primary Mobile</label>
              <input value={bulkForm.phone} onChange={e => setBulkForm({...bulkForm, phone: e.target.value})} className="input-mm py-2 text-sm" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Emergency Mobile</label>
              <input value={bulkForm.emergencyPhone} onChange={e => setBulkForm({...bulkForm, emergencyPhone: e.target.value})} className="input-mm py-2 text-sm" placeholder="Alternate Number" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Privacy Protocol</label>
              <div className="flex bg-gray-100 p-1 rounded-2xl h-[40px]">
                <button type="button" onClick={() => setBulkForm({...bulkForm, phonePrivacyMode: 'private'})} className={`flex-1 rounded-xl text-[10px] font-black tracking-widest transition-all ${bulkForm.phonePrivacyMode === 'private' ? 'bg-white text-dark-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Private</button>
                <button type="button" onClick={() => setBulkForm({...bulkForm, phonePrivacyMode: 'public'})} className={`flex-1 rounded-xl text-[10px] font-black tracking-widest transition-all ${bulkForm.phonePrivacyMode === 'public' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Public</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contextual Intelligence */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-dark-blue text-white text-[10px] font-black flex items-center justify-center">04</span>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400">Contextual Intelligence</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["WATER_COOLER", "AIR_CONDITIONER", "LAB_EQUIPMENT", "SCHOOL_ASSET"].includes(bulkForm.category) && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">Maintenance Manager</label>
                  <input value={bulkForm.cleanerName} onChange={e => setBulkForm({...bulkForm, cleanerName: e.target.value})} className="input-mm py-2 text-sm placeholder:text-blue-200" placeholder="Ops Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">TDS Index</label>
                  <input value={bulkForm.tds} onChange={e => setBulkForm({...bulkForm, tds: e.target.value})} className="input-mm py-2 text-sm" placeholder="Metric PPM" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">Last Service Date</label>
                  <input type="date" value={bulkForm.lastCleaningDate && bulkForm.lastCleaningDate.split('T')[0]} onChange={e => setBulkForm({...bulkForm, lastCleaningDate: e.target.value})} className="input-mm py-2 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">Next Service Schedule</label>
                  <input type="date" value={bulkForm.nextCleaningDate && bulkForm.nextCleaningDate.split('T')[0]} onChange={e => setBulkForm({...bulkForm, nextCleaningDate: e.target.value})} className="input-mm py-2 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">Last RO Filter Change</label>
                  <input type="date" value={bulkForm.lastRoFilterChangeDate && bulkForm.lastRoFilterChangeDate.split('T')[0]} onChange={e => setBulkForm({...bulkForm, lastRoFilterChangeDate: e.target.value})} className="input-mm py-2 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 tracking-widest">Next RO Filter Change</label>
                  <input type="date" value={bulkForm.nextRoFilterChangeDate && bulkForm.nextRoFilterChangeDate.split('T')[0]} onChange={e => setBulkForm({...bulkForm, nextRoFilterChangeDate: e.target.value})} className="input-mm py-2 text-sm font-bold" />
                </div>
              </div>
            )}

            {bulkForm.category === "SHOPS" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50/50 rounded-3xl border border-yellow-100/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-yellow-600 tracking-widest">Operational Hours</label>
                  <input value={bulkForm.shopTiming} onChange={e => setBulkForm({...bulkForm, shopTiming: e.target.value})} className="input-mm py-2 text-sm" placeholder="e.g. 9 AM - 10 PM" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-yellow-600 tracking-widest">Business Narrative</label>
                  <input value={bulkForm.shopDescription} onChange={e => setBulkForm({...bulkForm, shopDescription: e.target.value})} className="input-mm py-2 text-sm" placeholder="Brief description..." />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Extended Info (Public)</label>
              <textarea value={bulkForm.info} onChange={e => setBulkForm({...bulkForm, info: e.target.value})} className="input-mm py-2 text-sm min-h-[100px] resize-none" placeholder="Details visible to anyone who scans..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Emergency Data (Verified)</label>
              <textarea value={bulkForm.emergencyInfo} onChange={e => setBulkForm({...bulkForm, emergencyInfo: e.target.value})} className="input-mm py-2 text-sm min-h-[100px] resize-none" placeholder="Only visible in emergency state..." />
            </div>
          </div>
        </div>

        {bulkMessage && (
          <div className={`p-3 rounded-3xl text-xs font-black tracking-wide flex items-center gap-3 animate-fade-in ${bulkMessage.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            <i className={bulkMessage.type === 'success' ? "ri-checkbox-circle-fill text-xl" : "ri-error-warning-fill text-xl"}></i> {bulkMessage.text}
          </div>
        )}

        <button disabled={bulkCreating} className="btn-mm btn-mm-primary w-full h-14 text-base font-black tracking-[0.4em] shadow-2xl shadow-yellow-400/30 group relative overflow-hidden">
          <span className="relative z-10">{bulkCreating ? "Creating..." : "Create QR Code"}</span>
          <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        </button>
      </form>
    </div>

    <div className="space-y-6">
      <div className="mm-card-lg p-6 bg-white border-0 sticky top-32">
        <h4 className="text-xl font-black mb-4 tracking-tight flex justify-between items-center">
          <span>Genesis Logs</span>
          <span className="text-[9px] font-black text-gray-400 tracking-[0.2em]">Recent Tokens</span>
        </h4>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          {tags.slice(0, 15).map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-dark-blue/20 transition-all cursor-default">
              <div className="flex items-center gap-3">
                {/* <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-dark-blue shadow-sm font-mono font-black border border-gray-100 group-hover:scale-110 transition-transform">#{t.customId.slice(-4).toUpperCase()}</div> */}
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{t.name || t.customId}</p>
                  <span className="text-[8px] font-black text-gray-400 tracking-widest px-1.5 py-0.5 bg-white border border-gray-100 rounded-md">ID: {t.customId}</span>
                </div>
              </div>
              <button onClick={() => router.push(`/data?id=${t.customId}`)} className="text-gray-300 hover:text-dark-blue transition-colors"><i className="ri-arrow-right-circle-line text-2xl"></i></button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  </div>
)}




             {activeTab === "orders" && (
               <div className="mm-card-lg overflow-hidden border-0 bg-white">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Physical JTag Orders</h3>
                    <div className="flex gap-3">
                       <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-full uppercase">Total: {orders.filter(o => o.address !== "Online Service").length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
                         <tr>
                           <th className="px-8 py-5">Recipient</th>
                           <th className="px-8 py-5">Contact</th>
                           <th className="px-8 py-5">Destination</th>
                           <th className="px-8 py-5">Status</th>
                           <th className="px-8 py-5 text-right">Update Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {orders.filter(o => o.address !== "Online Service").map((order, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-8 py-6">
                                  <p className="font-black text-gray-900 text-sm leading-none mb-1">{order.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tag: #{order.tagId}</p>
                               </td>
                               <td className="px-8 py-6 font-bold text-xs text-gray-500">{order.phone}</td>
                               <td className="px-8 py-6">
                                  <p className="text-xs text-gray-600 truncate max-w-[200px]">{order.address}</p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">{order.pincode}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    order.orderStatus === 'delivered' ? 'bg-green-100 text-green-600' : 
                                    order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-600' : 
                                    order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                  }`}>{order.orderStatus}</span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <select 
                                    value={order.orderStatus} 
                                    onChange={(e) => handleOrderStatus(order._id, e.target.value)}
                                    className="bg-gray-100 border-0 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-dark-blue/10"
                                  >
                                     <option value="processing">Processing</option>
                                     <option value="shipped">Shipped</option>
                                     <option value="delivered">Delivered</option>
                                     <option value="cancelled">Cancelled</option>
                                  </select>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
             )}

             {activeTab === "shopkeepers" && (
               <div className="space-y-8">
                  <div className="mm-card-lg overflow-hidden border-0 bg-white">
                    <div className="p-8 border-b border-gray-100">
                      <h3 className="text-xl font-black tracking-tight">Shopkeeper Network</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
                           <tr>
                             <th className="px-8 py-5">Shopkeeper</th>
                             <th className="px-8 py-5">Partner Code</th>
                             <th className="px-8 py-5">Performance</th>
                             <th className="px-8 py-5">Commission</th>
                             <th className="px-8 py-5">Status</th>
                             <th className="px-8 py-5 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {shopkeepers.map((sk, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                 <td className="px-8 py-6">
                                    <p className="font-black text-gray-900 text-sm leading-none mb-1">{sk.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{sk.email}</p>
                                 </td>
                                 <td className="px-8 py-6 font-mono font-black text-yellow-600 text-xs bg-yellow-50/50">{sk.referralCode || "—"}</td>
                                 <td className="px-8 py-6">
                                    <div className="flex gap-4">
                                       <div><p className="text-[9px] font-black text-gray-400 uppercase">Tags</p><p className="font-black text-xs">{sk.tagsCount}</p></div>
                                       <div><p className="text-[9px] font-black text-gray-400 uppercase">Ref</p><p className="font-black text-xs">{sk.referralCount}</p></div>
                                       <div><p className="text-[9px] font-black text-gray-400 uppercase">Sales</p><p className="font-black text-xs text-emerald-600">₹{sk.totalSales}</p></div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Pending Balance</p>
                                    <p className={`font-black text-sm ${sk.pendingCommission > 0 ? 'text-orange-500' : 'text-green-500'}`}>₹{sk.pendingCommission}</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sk.isApproved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{sk.isApproved ? 'Approved' : 'Pending'}</span>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <button onClick={() => handleToggleApproval(sk._id, sk.isApproved)} className={`text-[10px] mr-3 font-black uppercase tracking-widest hover:underline ${sk.isApproved ? 'text-red-500' : 'text-green-500'}`}>{sk.isApproved ? 'Revoke' : 'Approve'}</button>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-dark-blue hover:underline">Manage Wallet</button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    </div>
                  </div>
               </div>
             )}

             {activeTab === "users" && (
               <div className="mm-card-lg overflow-hidden border-0 bg-white">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Member Directory</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
                         <tr>
                           <th className="px-8 py-5" width="40%">Identity</th>
                           <th className="px-8 py-5">Role</th>
                           <th className="px-8 py-5">Registration Date</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {users.map((user, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                               <td className="px-8 py-6">
                                  <p className="font-black text-gray-900 text-sm leading-none mb-1">{user.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-100 text-red-600' : user.role === 'shopkeeper' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'}`}>{user.role}</span>
                               </td>
                               <td className="px-8 py-6 font-bold text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
             )}

             {activeTab === "settings" && (
               <div className="max-w-2xl space-y-8">
                  {/* Messaging Channel Switcher */}
                  <div className="mm-card-lg p-10 bg-white border-0">
                    <h3 className="text-2xl font-black tracking-tight mb-2">Messaging Channel</h3>
                    <p className="text-xs text-gray-400 font-bold mb-8">Select which service should be used as the primary notification channel. The other will act as a fallback.</p>
                    
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                      <button
                        type="button"
                        disabled={channelSaving}
                        onClick={async () => {
                          if (messagingChannel === "httpsms") return;
                          setChannelSaving(true);
                          try {
                            const res = await API.put("/admin/settings", { messagingChannel: "httpsms" });
                            if (res.data.success) {
                              setMessagingChannel("httpsms");
                              setSettings(res.data.data);
                            }
                          } catch { alert("Failed to switch channel."); } finally { setChannelSaving(false); }
                        }}
                        className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                          messagingChannel === "httpsms"
                            ? "bg-dark-blue text-white shadow-lg shadow-blue-900/20"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <i className="ri-message-2-fill text-base"></i> httpSMS
                      </button>
                      <button
                        type="button"
                        disabled={channelSaving}
                        onClick={async () => {
                          if (messagingChannel === "whatsapp") return;
                          setChannelSaving(true);
                          try {
                            const res = await API.put("/admin/settings", { messagingChannel: "whatsapp" });
                            if (res.data.success) {
                              setMessagingChannel("whatsapp");
                              setSettings(res.data.data);
                            }
                          } catch { alert("Failed to switch channel."); } finally { setChannelSaving(false); }
                        }}
                        className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                          messagingChannel === "whatsapp"
                            ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <i className="ri-whatsapp-fill text-base"></i> WhatsApp
                      </button>
                    </div>

                    <div className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                      messagingChannel === "whatsapp" ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      <i className={messagingChannel === "whatsapp" ? "ri-whatsapp-fill text-lg" : "ri-message-2-fill text-lg"}></i>
                      {messagingChannel === "whatsapp"
                        ? "Messages will be sent via WhatsApp Cloud API first. httpSMS will be used as fallback."
                        : "Messages will be sent via httpSMS first. WhatsApp Cloud API will be used as fallback."}
                    </div>
                  </div>

                  {/* Existing Settings Form */}
                  <div className="mm-card-lg p-10 bg-white border-0">
                    <h3 className="text-2xl font-black tracking-tight mb-8">Platform Configuration</h3>
                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Universal Tag Price (₹)</label>
                          <input type="number" value={settingsForm.tagPrice} onChange={e => setSettingsForm({...settingsForm, tagPrice: Number(e.target.value)})} className="input-mm py-2! font-black" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Sticker Display Text</label>
                          <input type="text" value={settingsForm.stickerPriceText} onChange={e => setSettingsForm({...settingsForm, stickerPriceText: e.target.value})} className="input-mm py-2!" required />
                       </div>
                       <button type="submit" disabled={settingsLoading} className="btn-mm btn-mm-primary w-full h-16 uppercase font-black tracking-widest shadow-xl shadow-blue-900/20">
                          {settingsLoading ? "Synchronizing..." : "Update Global Settings"}
                       </button>
                    </form>
                  </div>
               </div>
             )}

             {activeTab === "coupons" && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="mm-card-lg p-10 bg-white border-0">
                    <h3 className="text-xl font-black tracking-tight mb-8">Create Launch Promotion</h3>
                    <form onSubmit={handleCreateCoupon} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promo Code</label>
                          <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="input-mm py-2! font-mono font-black" placeholder="OFF100" required />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount %</label>
                             <input type="number" value={couponForm.discountPercent} onChange={e => setCouponForm({...couponForm, discountPercent: Number(e.target.value)})} className="input-mm py-2! font-black" required />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Uses</label>
                             <input type="number" value={couponForm.maxUses} onChange={e => setCouponForm({...couponForm, maxUses: Number(e.target.value)})} className="input-mm py-2! font-black" required />
                          </div>
                       </div>
                       <button type="submit" disabled={couponLoading} className="btn-mm btn-mm-accent w-full h-16 uppercase font-black tracking-widest">
                          {couponLoading ? "Forging Code..." : "Launch Coupon"}
                       </button>
                    </form>
                  </div>
                  <div className="mm-card-lg p-10 bg-white border-0 overflow-y-auto max-h-[600px] scrollbar-hide">
                     <h3 className="text-xl font-black tracking-tight mb-8">Live Promotions</h3>
                     <div className="space-y-4">
                        {coupons.map((c, i) => (
                          <div key={i} className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center group">
                             <div>
                                <p className="font-mono font-black text-gray-900 border-b-2 border-yellow-400 inline-block mb-2">{c.code}</p>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{c.discountPercent}% Discount · {c.usedCount}/{c.maxUses} used</p>
                             </div>
                             <button onClick={() => handleDeleteCoupon(c._id)} className="w-10 h-10 rounded-xl bg-white text-gray-300 hover:text-red-500 hover:border-red-100 border border-gray-100 transition-all flex items-center justify-center">
                                <i className="ri-delete-bin-line"></i>
                             </button>
                          </div>
                        ))}
                        {coupons.length === 0 && <p className="text-center text-gray-400 text-xs font-bold py-10 uppercase tracking-widest opacity-40">No active promotions</p>}
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>
           
      </div>
    </Layout>
  );
}
