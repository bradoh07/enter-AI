import { Navigate } from "react-router-dom";

import { PageLoading } from "@/components/common/EmptyState";
import { useAuth } from "@/providers/auth-provider";

/** Entry point: route the visitor to the app or to sign-in. */
const Index = () => {
  const { user, initializing } = useAuth();

  if (initializing) return <PageLoading />;

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

export default Index;
