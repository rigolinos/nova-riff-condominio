import * as React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const LoadingScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time before redirecting to main page
    const timer = setTimeout(() => {
      navigate("/dashboard"); // Redirect to dashboard after loading
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="bg-[rgba(3,29,36,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-center justify-center text-white mx-auto min-h-screen px-8">
      {/* Main Content */}
      <div className="text-center mb-16">
        <h1 className="text-[32px] font-bold leading-[40px] mb-6">
          Aguarde um instante!
        </h1>
        <p className="text-lg font-normal opacity-80">
          Estamos personalizando<br />sua experiência.
        </p>
      </div>

      {/* Loading Spinner */}
      <div className="w-16 h-16 border-4 border-[rgba(119,136,143,0.3)] border-t-[rgba(241,216,110,1)] rounded-full animate-spin"></div>
    </main>
  );
};