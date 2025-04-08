"use client";
import "./globals.css";
import "./data-tables-css.css";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer/footer";
import { AuthProvider, useAuth } from "@/components/context/AuthContext";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className="bg-gray-50 dark:bg-boxdark-2"
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <LayoutContent
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              {children}
            </LayoutContent>
          </div>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children, sidebarOpen, setSidebarOpen }) {
  const { user, loading, authorised } = useAuth();
  const pathname = usePathname();

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-boxdark-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  // Handle unauthorized access
  if (!authorised && pathname !== "/login") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-boxdark-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center p-8 rounded-lg bg-white dark:bg-boxdark shadow-lg"
        >
          <h1 className="mb-4 text-2xl font-bold text-danger">Access Denied</h1>
          <p className="text-bodydark2">
            {`You don't have permission to access this page.`}
          </p>
        </motion.div>
      </div>
    );
  }

  // Don't show layout for login page
  if (pathname === "/login") {
    return children;
  }

  // Main layout for authenticated users
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userRole={user?.role || "none"}
      />

      <div
        className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ${
          sidebarOpen ? "ml-60" : "ml-0"
        }`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
        />

        <main className="flex-1">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
