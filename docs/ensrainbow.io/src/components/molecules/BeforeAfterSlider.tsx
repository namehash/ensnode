import "../../styles/slider-styles.css";
import React from "react";
import known_name from "../../assets/Name-healed.svg";
import unknown_name from "../../assets/Name.svg";
import { HealedNameImage } from "../atoms/HealedNameImage.tsx";
import { NameImage } from "../atoms/NameImage.tsx";

export default function BeforeAfterSlider() {
  return (
    <div className="wrapper not-content">
      <div className="hidden sm:flex">
        <img className="image1" alt="unknown-name" src={unknown_name.src} />
        <img className="image2" alt="known-name" src={known_name.src} />
      </div>

      <div className="flex sm:hidden">
        <NameImage styles="image1" />
        <HealedNameImage styles="image2" />
      </div>
      <div className="outerController">
        <div className="innerController">
          <div className="line"></div>
        </div>
      </div>
    </div>
  );
}
