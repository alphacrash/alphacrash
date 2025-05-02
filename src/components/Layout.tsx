import React from "react";
import { useTheme } from "../context/ThemeContext";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar />
      <main className="container mx-auto px-4 md:px-6">{children}</main>
    </div>
  );
};

export default Layout;
