import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "../context/AuthContext";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const RoleTag = ({ role }: { role?: string }) => {
  const getRoleColor = () => {
    switch (role?.toLowerCase()) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "franchisee":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "partner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleIcon = () => {
    switch (role?.toLowerCase()) {
      case "super_admin":
        return "mdi:shield-crown";
      case "franchisee":
        return "mdi:office-building";
      case "partner":
        return "mdi:account-group";
      default:
        return "mdi:account";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}
    >
      <Icon icon={getRoleIcon()} className="w-3 h-3" />
      {role?.replace("_", " ").toUpperCase()}
    </span>
  );
};

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);
  const { user } = useAuth();
  const router = useRouter();

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className="relative">
      <Link
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        href="#"
      >
        <div className="hidden text-sm lg:flex-col text-right lg:flex items-start ">
          {user?.partnerName}
          <RoleTag role={user?.role} />
        </div>

        <div className="relative">
          {user?.partnerLogo ? (
            <Image
              width={40}
              height={40}
              className="rounded-full object-cover"
              src={user?.partnerLogo}
              alt={user?.partnerName}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-meta-4">
              <Icon
                width={40}
                icon="healthicons:ui-user-profile-outline"
                className="text-gray-400"
              />
            </div>
          )}
        </div>
      </Link>

      <div
        ref={dropdown}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${
          dropdownOpen === true ? "block" : "hidden"
        }`}
      >
        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
              {user?.partnerLogo ? (
                <Image
                  width={112}
                  height={112}
                  className="rounded-full object-cover"
                  src={user?.partnerLogo}
                  alt={user?.partnerName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-meta-4">
                  <Icon
                    width={40}
                    icon="healthicons:ui-user-profile-outline"
                    className="text-gray-400"
                  />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white">
                {user?.partnerName}
              </h4>
              <RoleTag role={user?.role} />
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2 border-b border-stroke px-4 py-3 dark:border-strokedark">
          <li>
            <Link
              href="/settings"
              className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            >
              <Icon width={20} icon="weui:setting-outlined" />
              Account Settings
            </Link>
          </li>
        </ul>
        <button
          onClick={() => {
            signOut(auth);
            Cookies.remove("token");
            router.push("/login");
          }}
          className="flex items-center gap-3.5 py-4 px-6 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
        >
          <Icon icon="system-uicons:exit-left" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DropdownUser;
