"use client";

import React, { useState, ReactNode } from 'react';
import {
  MenuIcon,
  X,
  Home,
  AlertTriangle,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Search,
  Map,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

interface NavigationProps {
  children: ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { href: '/trends', icon: TrendingUp, label: 'Trends' },
    { href: '/cases', icon: Users, label: 'Cases' },
    { href: '/locations', icon: Map, label: 'Locations' }
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b fixed w-full top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span className="text-xl font-bold">Disease Monitor</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts, cases, locations..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b lg:pt-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 mb-1",
                      isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive && "text-blue-700"
                    )} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <HelpCircle className="h-5 w-5" />
              Help & Resources
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className={`pt-16 transition-all duration-200 ease-in-out ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64'
      }`}>
        <div className="p-4">
          {children}
        </div>
      </main>
    </>
  );
};

export default Navigation;