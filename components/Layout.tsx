import { supabase } from "../services/supabase";
import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
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
import Logo from "../components/Logo";

interface LayoutProps {
  children: React.ReactNode;
  onOpenLogModal: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onOpenLogModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 🚀 route preloader for instant navigation
  const preloadRoute = (path: string) => {
    if (path === "/") import("../pages/Dashboard");
    if (path === "/logs") import("../pages/Logs");
    if (path === "/projects") import("../pages/Projects");
    if (path === "/analytics") import("../pages/Analytics");
    if (path === "/reports") import("../pages/Reports");
    if (path === "/settings") import("../pages/Settings");
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const accentColor =
    ACCENT_COLORS[user?.accentColor as keyof typeof ACCENT_COLORS] ||
    "#F4C430";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

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
    <div className="min-h-screen w-full bg-[#f7f7f5] dark:bg-[#191919] relative overflow-hidden">
      <div className="relative z-10 w-full min-h-screen flex items-stretch p-0">
        <div className="w-full flex bg-[#f7f7f5] dark:bg-[#191919] md:border md:border-slate-200 dark:md:border-[#2a2a2a]">

          {/* SIDEBAR — desktop only */}
          <aside className="hidden md:flex w-[90px] flex-col items-center py-8 border-r border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e]">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Logo size={20} />
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
                    onMouseEnter={() => preloadRoute(item.path)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-150 ${isActive
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:text-slate-700 dark:hover:text-slate-200"
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
          <div className="flex-1 flex flex-col min-w-0">
            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 md:px-10 py-3 md:py-5 border-b border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e]">
              <h1 className="text-[16px] md:text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ||
                  "Dashboard"}
              </h1>

              <div className="flex items-center gap-2 md:gap-4">
                {/* New Log */}
                <button
                  onClick={onOpenLogModal}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white transition-colors"
                >
                  <Plus size={16} className="text-white dark:text-slate-900" />
                  <span className="hidden sm:inline text-sm font-semibold text-white dark:text-slate-900">
                    New log
                  </span>
                </button>

                {/* Date + Time — desktop only */}
                <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock size={14} className="text-slate-400" />
                  {currentTime}
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  {currentDate}
                </div>

                {/* Profile + Logout */}
                <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                  <img
                    src={
                      user?.user_metadata?.avatar_url ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    alt="User"
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  />

                  <div className="leading-tight hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">
                      {user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </p>
                    <p className="text-[12px] text-slate-500 truncate max-w-[120px] md:max-w-[170px]">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="ml-1 md:ml-2 p-1.5 md:p-2 rounded-lg hover:bg-slate-100 transition"
                    title="Logout"
                  >
                    <LogOut size={16} className="text-slate-500 md:hidden" />
                    <LogOut size={18} className="text-slate-500 hidden md:block" />
                  </button>
                </div>
              </div>
            </div>

            {/* PAGE CONTENT */}
            <main className="flex-1 px-4 md:px-10 py-5 md:py-8 overflow-y-auto bg-[#f7f7f5] dark:bg-[#191919] pb-24 md:pb-8">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] border-t border-slate-200 dark:border-[#2a2a2a] z-50 flex justify-around items-center px-1 pt-2 pb-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          const Icon = iconMap[item.label] || item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              onMouseEnter={() => preloadRoute(item.path)}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-150 ${
                isActive ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-150 ${
                  isActive ? "bg-slate-100" : ""
                }`}
              >
                <Icon size={20} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
