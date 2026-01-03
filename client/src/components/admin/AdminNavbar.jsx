import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
      <Link to="/" className="flex items-center gap-2">
        <img src={assets.logo} alt="MovieDeck" className="w-36 h-auto" />
        <span className="text-xl font-bold text-primary hidden sm:block">
          MovieDeck
        </span>
      </Link>
    </div>
  );
};

export default AdminNavbar;
