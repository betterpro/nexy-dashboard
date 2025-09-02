// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Assuming you're using Next.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, DB } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ROLES } from "./roles";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const router = useRouter(); // Get the router instance

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      setAuthorised(false);
      document.cookie =
        "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // User is logged in, get Firestore user data
        const userRef = await getDoc(doc(DB, "users", u.uid));
        const userData = userRef.data();

        // Ensure the user has a valid role
        if (!userData || !Object.values(ROLES).includes(userData.role)) {
          console.error("Invalid user role:", userData?.role);
          setUser(null);
          setUserRole(null);
          setAuthorised(false);
          router.push("/login");
          return;
        }

        // Additional validation for franchisee users
        if (userData.role === ROLES.FRANCHISEE && !userData.franchiseeId) {
          console.error("Franchisee user missing franchiseeId:", userData);
          setUser(null);
          setUserRole(null);
          setAuthorised(false);
          router.push("/login");
          return;
        }

        setUser({ ...u, ...userData });
        setUserRole(userData.role);
        setAuthorised(true);

        // Set user role in cookie for middleware
        document.cookie = `userRole=${userData.role}; path=/`;
      } else {
        // User is logged out, set user to null and redirect to login page
        setUser(null);
        setUserRole(null);
        setAuthorised(false);
        document.cookie =
          "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, authorised, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
