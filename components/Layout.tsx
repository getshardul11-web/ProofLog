import { supabase } from "../services/supabase";
import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { NAV_ITEMS } from "../constants";
import { ACCENT_COLORS } from "../types";
import {
  Plus,
  Settings,
  LayoutDashboard,
  FolderKanban,
  FileText,
  BarChart3,
  NotebookText,
  Calendar,
  Clock,
  LogOut,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onOpenLogModal: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onOpenLogModal }) => {
  const location = useLocation();

  // ✅ user state
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    loadUser();
  }, []);

  // ✅ SAFE accent color (prevents crash)
  const accentColor =
    ACCENT_COLORS[user?.accentColor as keyof typeof ACCENT_COLORS] ||
    "#F4C430";

  // ✅ logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Live clock
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);

    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [accentColor]);

  // Sidebar icons mapping
  const iconMap: Record<string, any> = {
    Dashboard: LayoutDashboard,
    Logs: NotebookText,
    Projects: FolderKanban,
    Analytics: BarChart3,
    Reports: FileText,
    Settings: Settings,
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      <div className="relative z-10 w-full min-h-screen flex items-stretch p-0">
        <div className="w-full flex overflow-hidden bg-white border border-black/20 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
          
          {/* SIDEBAR */}
          <aside className="w-[90px] flex flex-col items-center py-8 border-r border-black/20 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/20 shadow-sm flex items-center justify-center">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: accentColor,
                }}
              />
            </div>

            <div className="mt-14 flex flex-col gap-5 w-full items-center">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));

                const Icon = iconMap[item.label] || item.icon;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-black/20"
                    }`}
                  >
                    <Icon size={25} />
                  </Link>
                );
              })}
            </div>

            <div className="flex-1" />
          </aside>

          {/* MAIN */}
          <div className="flex-1 flex flex-col">
            {/* TOP BAR */}
            <div style={{ color: 'red', fontWeight: 700 }}>
  DEBUG BUILD v2
</div>
            <div className="flex items-center justify-between px-10 py-6 border-b border-black/20 bg-white">
              <h1 className="text-[20px] font-bold tracking-tight text-slate-900">
                {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ||
                  "Dashboard"}
              </h1>

              <div className="flex items-center gap-4">
                {/* New Log */}
                <button
                  onClick={onOpenLogModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-black/20 shadow-sm hover:bg-slate-50"
                >
                  <Plus size={18} style={{ color: accentColor }} />
                  <span className="text-sm font-semibold text-slate-800">
                    New log
                  </span>
                </button>

                {/* Date */}
                <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-full border border-black/20 shadow-sm">
                  <Calendar size={16} className="text-slate-400" />
                  {currentDate}
                </div>

                {/* Time */}
                <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-full border border-black/20 shadow-sm">
                  <Clock size={16} className="text-slate-400" />
                  {currentTime}
                </div>

                {/* ✅ PROFILE + LOGOUT */}
                <div className="flex items-center gap-3 bg-white border border-black/20 shadow-sm rounded-full px-4 py-2.5">
                  <img
                    src={
                      user?.user_metadata?.avatar_url ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    alt="User"
                    className="w-9 h-9 rounded-full object-cover border border-black/20"
                  />

                  <div className="leading-tight hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">
                      {user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </p>
                    <p className="text-[12px] text-slate-500 truncate max-w-[170px]">
                      {user?.email}
                    </p>
                  </div>

                  {/* 🔥 LOGOUT BUTTON */}
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-2 rounded-lg hover:bg-slate-100 transition"
                    title="Logout"
                  >
                    <LogOut size={18} className="text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* PAGE */}
            <main className="flex-1 px-10 py-8 overflow-y-auto bg-white">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;