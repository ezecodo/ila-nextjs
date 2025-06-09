"use client";

export function PrevArrow({ onClick }) {
  return (
    <div onClick={onClick} className="triangle-arrow left-arrow">
      <div className="triangle-left" />
    </div>
  );
}

export function NextArrow({ onClick }) {
  return (
    <div onClick={onClick} className="triangle-arrow right-arrow">
      <div className="triangle-right" />
    </div>
  );
}
