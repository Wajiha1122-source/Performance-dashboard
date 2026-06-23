import React from "react";
import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Layout({ activeView, setActiveView, currentUser, onLogout, navItems, searchTerm, setSearchTerm, unreadCount, onNotifications, children }) {
  const initials = (currentUser?.name || currentUser?.label || "User").split(" ").map((part) => part[0]).join("").slice(0, 2);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <strong>PerformanceOS</strong>
            <span>Executive suite</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => setActiveView(item.id)}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-panel">
          <span>Session</span>
          <strong>{currentUser?.name || currentUser?.label || "User"}</strong>
          <small>{currentUser?.email || "Local session"} / {currentUser?.label || "RBAC"} access</small>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Performance / {navItems.find((item) => item.id === activeView)?.label}</span>
            <h1>Employee Performance Command Center</h1>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search employees, tasks, reports..." />
            </label>
            <button className="icon-button" aria-label="Notifications" onClick={onNotifications}><Bell size={18} />{unreadCount > 0 && <b>{unreadCount}</b>}</button>
            <button className="profile-pill">{initials}</button>
            <button className="icon-button" aria-label="Sign out" onClick={onLogout}><LogOut size={18} /></button>
          </div>
        </header>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="content-wrap"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
