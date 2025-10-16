"use client";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { motion } from "framer-motion";

const menuItems = [
  {
    title: "Dashboard",
    icon: "mdi:view-dashboard",
    href: "/dashboard",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    color: "bg-blue-500",
    description: "View your analytics and statistics",
  },
  {
    title: "Stations",
    icon: "mdi:ev-station",
    href: "/stations",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
    color: "bg-green-500",
    description: "Manage your charging stations",
  },
  {
    title: "Station Data",
    icon: "material-symbols-light:ev-station-outline",
    href: "/new-stations",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    color: "bg-cyan-500",
    description: "Edit station information and settings",
  },
  {
    title: "Screen Management",
    icon: "material-symbols-light:display-settings-outline",
    href: "/screen",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    color: "bg-indigo-500",
    description: "Manage station screen layouts",
  },
  {
    title: "Partners",
    icon: "mdi:account-group",
    href: "/partners",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
    color: "bg-purple-500",
    description: "Manage your business partners",
  },
  {
    title: "Orders",
    icon: "mdi:clipboard-list",
    href: "/orders",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    color: "bg-orange-500",
    description: "View and manage orders",
  },
  {
    title: "Settings",
    icon: "mdi:cog",
    href: "/settings",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    color: "bg-gray-500",
    description: "Configure your account settings",
  },
];

const HomePage = () => {
  const { userRole } = useAuth();
  console.log(userRole);
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Nexy Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select a section to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <div className="group relative bg-white dark:bg-boxdark rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${item.color}`}
                  />
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div
                        className={`p-3 rounded-lg ${item.color} text-black z-9999 mr-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon icon={item.icon} className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
