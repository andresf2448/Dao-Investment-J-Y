import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProtocolCapabilities } from "@/hooks/useProtocolCapabilities";
import type { ProtocolCapabilities } from "@/types/capabilities";

interface ProtectedRouteProps {
  capability: keyof ProtocolCapabilities;
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  capability,
  children,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const location = useLocation();
  const capabilities = useProtocolCapabilities();

  if (!capabilities[capability]) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
