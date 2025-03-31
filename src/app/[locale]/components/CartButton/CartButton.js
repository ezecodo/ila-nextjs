"use client";

export default function CartButton({ onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`absolute top-2 right-2 z-10 ${className} cursor-pointer`}
    >
      <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 shadow-lg transition-all duration-200 ease-in-out hover:bg-red-800 hover:scale-110"></i>
    </div>
  );
}
