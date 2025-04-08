"use client";
import "../globals.css";
import "../data-tables-css.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/components/context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AuthProvider>
  );
}
