import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const withRoleAuth = (WrappedComponent, allowedRoles) => {
  const RoleAuthenticatedComponent = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/login");
        } else if (!allowedRoles.includes(user.role)) {
          router.push("/not-authorized");
        }
      }
    }, [user, loading, router]);

    if (loading || !user || !allowedRoles.includes(user.role)) {
      return <p>Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };

  RoleAuthenticatedComponent.displayName = `WithRoleAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return RoleAuthenticatedComponent;
};

export default withRoleAuth;
