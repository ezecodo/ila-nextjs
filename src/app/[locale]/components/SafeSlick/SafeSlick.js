"use client";

import dynamic from "next/dynamic";

const SlickSlider = dynamic(
  () => import("react-slick").then((mod) => mod.default),
  {
    ssr: false,
  }
);

export default SlickSlider;
