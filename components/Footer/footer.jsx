import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

const Footer = () => {
  return (
    <footer className="py-4 px-6 border-t border-stroke dark:border-strokedark">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Nexy. All rights reserved.
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://nexy.ca/privacy"
            className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="https://nexy.ca/terms"
            className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
