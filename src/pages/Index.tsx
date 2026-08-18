import { Navigate } from "react-router-dom";

const Index = () => {
  // BYPASSED LOGIN: Redirect to dashboard directly
  return <Navigate to="/dashboard" replace />;
};

export default Index;
