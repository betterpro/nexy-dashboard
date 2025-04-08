"use client";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "@/firebase";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Failed to login.";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        default:
          errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-boxdark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <Image
              src="/images/logo/nexy-logo.png"
              alt="Nexy Logo"
              width={150}
              height={150}
              className="mx-auto"
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:bg-meta-4 dark:border-strokedark dark:text-white dark:hover:bg-meta-5"
          >
            <Icon icon="logos:google-icon" className="h-5 w-5" />
            Continue with Google
          </button>
        </div>

        <div className="relative my-8">
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500 dark:bg-boxdark dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 z-999 left-0 pl-3 flex items-center">
                  <Icon
                    icon="line-md:email"
                    className="h-5 w-5 text-gray-400"
                  />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-t-md relative block w-full px-3 py-3 pl-10 border border-stroke placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm dark:bg-meta-4 dark:border-strokedark dark:text-white"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 z-999 left-0 pl-3 flex items-center">
                  <Icon
                    icon="solar:password-broken"
                    className="h-5 w-5 text-gray-400"
                  />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-3 pl-10 border border-stroke placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm dark:bg-meta-4 dark:border-strokedark dark:text-white"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-white"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-amber-500 hover:text-amber-600 dark:text-amber-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-warning hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
