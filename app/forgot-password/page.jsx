"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
      setEmail("");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      let errorMessage = "Failed to send password reset email.";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        default:
          errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-boxdark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {`Enter your email address and we'll send you a link to reset your
            password.`}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon icon="mdi:email" className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-3 pl-10 border border-stroke placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-meta-4 dark:border-strokedark dark:text-white"
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/90 dark:text-primary"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
