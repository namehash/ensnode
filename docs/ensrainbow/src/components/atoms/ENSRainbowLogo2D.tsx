import cc from "classcat";

// export const ENSRainbowLogo2D = () => {
//     const logoColors = [
//         "bg-[#FF311C]",
//         "bg-[#FEC401]",
//         "bg-[#FEFB24]",
//         "bg-[#97FF2E]",
//         "bg-[#3FE8FF]",
//         "bg-[#9E49FF]"
//     ];
//
//     return (
//         <div className="w-8 h-8 shrink-0 rounded border-4 border-black">
//             {logoColors.map((elem, idx) => <div key={`logoBar${idx}`} className={cc(["w-6 h-1 shrink-0", elem])}/>)}
//         </div>
//     );
// }

export const ENSRainbowLogo2D = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="28" height="28" rx="2" stroke="black" strokeWidth="4"/>
        <path d="M4 4H28V8H4V4Z" fill="#FF311C"/>
        <path d="M4 16H28V20H4V16Z" fill="#97FF2E"/>
        <path d="M4 8H28V12H4V8Z" fill="#FEC401"/>
        <path d="M4 20H28V24H4V20Z" fill="#3FE8FF"/>
        <path d="M4 12H28V16H4V12Z" fill="#FEFB24"/>
        <path d="M4 24H28V28H4V24Z" fill="#9E49FF"/>
    </svg>
);