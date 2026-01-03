import React from "react";

const Title = ({ text2 }) => {
  return (
    <div className="flex items-center gap-2">
      <p className="text-2xl font-semibold text-gray-300">
        <span className="text-primary">{text2}</span>
      </p>
    </div>
  );
};

export default Title;
