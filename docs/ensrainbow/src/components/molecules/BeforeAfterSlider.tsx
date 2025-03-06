import "../../styles/slider-styles.css";
import React, {useState, useRef } from 'react';
import unknown_name from "../../assets/Name.svg";
import known_name from "../../assets/Name-healed.svg";

export default function BeforeAfterSlider() {

    // All this code is for the interactive version - left for now
    // Summing up - the only interactive and only animated versions are both easy to implement, but
    // combining them may prove really challenging
    const [imageRevealFraction, setImageRevealFraction] = useState(0.5);
    const imageContainer = useRef<HTMLDivElement>();

    const slide = (xPos: number) => {
        const containerBoundingRect = imageContainer.current.getBoundingClientRect();

        if (xPos < containerBoundingRect.left){
            setImageRevealFraction(0);
        }
        else if (xPos > containerBoundingRect.right){
            setImageRevealFraction(1.0);
        }
        else {
            setImageRevealFraction((xPos - containerBoundingRect.left) / containerBoundingRect.width);
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        slide(event.clientX);
    };

    const handleMouseUp = (event: MouseEvent) => {
        window.onmousemove = undefined;
        window.onmouseup = undefined;
    }

    const handleMouseOnController = () => {
        window.onmousemove = handleMouseMove;
        window.onmouseup = handleMouseUp;
    };

    return (
        <div className="wrapper not-content" ref={imageContainer}>
            <img className="image1" alt="unknown-name" src={unknown_name.src}/>
            <img className="image2" alt="known-name" src={known_name.src}
            //      style={{
            //     clipPath: `polygon(0 0, ${imageRevealFraction * 100}% 0, ${imageRevealFraction * 100}% 100%, 0 100%)`
            // }}
            />
            <div
            //     style={{
            //     left: `${imageRevealFraction * 100}%`
            // }}
                 className="outerController"
            >
                <div className="innerController">
                    <div className="line"></div>
                    {/*<div onMouseDown={handleMouseOnController} className="controllerButton">*/}
                    {/*    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}*/}
                    {/*         stroke="currentColor" className="size-6" style={{*/}
                    {/*             rotate: "90deg"*/}
                    {/*    }}>*/}
                    {/*        <path strokeLinecap="round" strokeLinejoin="round"*/}
                    {/*              d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"/>*/}
                    {/*    </svg>*/}

                    {/*</div>*/}
                </div>
            </div>
        </div>
    );
}