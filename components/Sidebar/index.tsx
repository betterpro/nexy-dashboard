import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { ROLES, UserRole } from "@/components/context/roles";
import { useAuth } from "@/components/context/AuthContext";

interface MenuItem {
  title: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

interface MenuCategory {
  title: string;
  icon: string;
  items: MenuItem[];
  roles: UserRole[];
}

const menuCategories: MenuCategory[] = [
  {
    title: "Dashboard",
    icon: "material-symbols-light:dashboard-outline",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    items: [
      {
        title: "Overview",
        path: "/",
        icon: "material-symbols-light:dashboard-outline",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
      },
    ],
  },
  {
    title: "Blog",
    icon: "material-symbols-light:article-outline",
    roles: [ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Create Post",
        path: "/blog",
        icon: "material-symbols-light:add-circle-outline",
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    title: "Stations",
    icon: "material-symbols-light:ev-station-outline",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
    items: [
      {
        title: "Stations List",
        path: "/stations",
        icon: "material-symbols-light:ev-station-outline",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "Add Station",
        path: "/stations/add",
        icon: "material-symbols-light:add-location-alt",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "Screen",
        path: "/screen",
        icon: "material-symbols-light:display-settings-outline",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "New Stations",
        path: "/new-stations",
        icon: "material-symbols-light:ev-station-outline",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "Station Management",
        path: "/station-management",
        icon: "material-symbols-light:settings-outline",
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    title: "Partners",
    icon: "material-symbols-light:ev-station-outline",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
    items: [
      {
        title: "Partners",
        path: "/partners",
        icon: "material-symbols-light:person-add",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "Add Partner",
        path: "/partners/addpartner",
        icon: "material-symbols-light:person-add",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
    ],
  },
  {
    title: "Financial",
    icon: "material-symbols-light:payments-outline",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    items: [
      {
        title: "Orders",
        path: "/orders",
        icon: "gg:reorder",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
      },
      {
        title: "Report",
        path: "/report",
        icon: "mdi:report-line-shimmer",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
      {
        title: "Release",
        path: "/release",
        icon: "ion:log-out-sharp",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE],
      },
    ],
  },
  {
    title: "Account",
    icon: "material-symbols-light:account-circle-outline",
    roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: "material-symbols-light:settings-outline",
        roles: [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
      },
    ],
  },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  userRole: UserRole | null;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, userRole }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  // Filter menu categories based on user role
  const filteredCategories = menuCategories.filter((category) =>
    category.roles.includes(userRole as UserRole)
  );

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return "Super Admin";
      case ROLES.FRANCHISEE:
        return "Franchisee";
      case ROLES.PARTNER:
        return "Partner";
      default:
        return "User";
    }
  };

  return (
    <aside
      ref={sidebar}
      className={`fixed left-0 top-0 z-9999 flex h-screen w-60 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/">
          <Image
            width={147}
            height={50}
            src={"/images/logo/nexy-logo-white.png"}
            alt="nexy"
          />
        </Link>
      </div>

      {/* <!-- User Info --> */}
      {user && (
        <div className="px-6 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user.partnerLogo && (
              <Image
                src={user.partnerLogo}
                alt={user.fullName || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {user.fullName || "User"}
              </span>
              <span className="text-xs text-white">
                {getRoleLabel(userRole as UserRole)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {filteredCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-6">
              <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                {category.title}
              </h3>

              <ul className="flex flex-col gap-1.5">
                {category.items
                  .filter((item) => item.roles.includes(userRole as UserRole))
                  .map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.path}
                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname?.includes(item.path)
                            ? "bg-graydark dark:bg-meta-4"
                            : ""
                        }`}
                      >
                        <Icon icon={item.icon} height={30} />
                        {item.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
