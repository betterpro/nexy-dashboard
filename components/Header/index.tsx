import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

const Header = (props: {
  sidebarOpen: boolean;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-999 flex w-full bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark">
      <div className="flex flex-grow items-center justify-between px-3 py-1.5">
        {/* Left Side - Mobile Menu Toggle */}
        <button
          onClick={() => props.setSidebarOpen(!props.sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={props.sidebarOpen}
          className="block lg:hidden"
        >
          <Icon icon="material-symbols:menu" className="text-2xl" />
        </button>
        <button
          onClick={() => props.setSidebarOpen(!props.sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={props.sidebarOpen}
          className="lg:block hidden"
        >
          <Icon icon="material-symbols:menu" className="text-2xl" />
        </button>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-8">
          {/* Dark Mode Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <DarkModeSwitcher />
          </motion.div>

          {/* User Menu */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <DropdownUser />
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
