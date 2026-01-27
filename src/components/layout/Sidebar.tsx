'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Tambah useRouter
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  FolderOpen,
  Archive,
  LogOut
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Daftar Arsip',
    href: '/arsip',
    icon: FileText,
  },
  {
    title: 'Manajemen Arsip',
    href: '#', 
    icon: FolderOpen,
    submenu: [
      { title: 'Input Arsip', href: '/arsip/input' },
      { title: 'Kelola Jenis', href: '/arsip/jenis' },
    ],
  },
  {
    title: 'Import/Export',
    href: '#',
    icon: UploadCloud,
    submenu: [
      { title: 'Import Excel', href: '/import' },
      { title: 'Export Data', href: '/export' },
    ],
  },
  {
    title: 'Manajemen User',
    href: '/users',
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Hook untuk navigasi manual
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) setOpenSubmenu(null);
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    // KONDISI 1: Jika item punya submenu (folder)
    if (item.submenu) {
      if (isCollapsed) {
        setIsCollapsed(false);
        setOpenSubmenu(item.title);
      } else {
        setOpenSubmenu(openSubmenu === item.title ? null : item.title);
      }
    } 
    // KONDISI 2: Jika item adalah link biasa (Dashboard, Daftar Arsip)
    else {
      // PENTING: Lakukan navigasi manual karena elemennya div onClick
      router.push(item.href);
    }
  };

  return (
    <div
      className={cn(
        "h-screen bg-[#0F172A] text-white flex flex-col transition-all duration-300 border-r border-slate-800 relative shadow-xl overflow-hidden",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* 1. HEADER */}
      <div className={cn(
        "h-[70px] flex items-center px-4 border-b border-slate-800/50 relative transition-all duration-300",
        isCollapsed ? "justify-center" : "justify-between group"
      )}>
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="relative group/mini flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          >
            <div className="absolute inset-0 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 transition-all duration-300 transform scale-100 opacity-100 group-hover/mini:scale-90 group-hover/mini:opacity-0">
               <Archive className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 bg-slate-800 rounded-xl border border-slate-600 flex items-center justify-center transition-all duration-300 transform scale-90 opacity-0 group-hover/mini:scale-100 group-hover/mini:opacity-100 text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-700">
               <ChevronRight size={24} />
            </div>
          </button>
        ) : (
          <>
             <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <Archive className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="font-bold text-base tracking-wide text-slate-100">Arsip Digital</span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Dinas Sosial</span>
                </div>
             </div>
             <button
                onClick={toggleSidebar}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
             >
                <ChevronLeft size={20} />
             </button>
          </>
        )}
      </div>

      {/* 2. MENU NAVIGASI */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-2">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || (item.submenu && pathname.startsWith(item.href));
          const isSubOpen = openSubmenu === item.title;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isChildActive = hasSubmenu && item.submenu?.some(sub => pathname === sub.href);

          return (
            <div key={index}>
              <div
                onClick={() => handleMenuClick(item)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative select-none",
                  (isActive || isChildActive) && !hasSubmenu
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100",
                   isCollapsed ? "justify-center" : "justify-between"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    (isActive || isChildActive) ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )} />
                  
                  <span className={cn(
                    "text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                  )}>
                    {item.title}
                  </span>
                </div>

                {!isCollapsed && hasSubmenu && (
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 text-slate-500 transition-transform duration-200", 
                      isSubOpen ? "rotate-180" : ""
                    )} 
                  />
                )}
              </div>

              {!isCollapsed && hasSubmenu && (isSubOpen || isChildActive) && (
                <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-3 animate-in slide-in-from-top-2 duration-200">
                  {item.submenu.map((sub, subIndex) => (
                    <Link
                      key={subIndex}
                      href={sub.href}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors relative",
                        pathname === sub.href
                          ? "text-blue-400 bg-slate-800/50 font-medium"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                      )}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. FOOTER */}
      <div className="p-4 border-t border-slate-800/50 bg-[#0F172A]">
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
            AD
          </div>
          
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}>
            <span className="text-sm font-semibold text-slate-200">Admin Dinsos</span>
            <span className="text-xs text-slate-500">Administrator</span>
          </div>

          {!isCollapsed && (
             <button className="ml-auto text-slate-500 hover:text-red-400 transition-colors" title="Logout">
               <LogOut size={18} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}