import type {IconProps} from "./TelegramIcon.tsx";

export const ExternalLinkIcon = (props: IconProps) => (
    <>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8 0C7.44772 0 7 0.447715 7 1C7 1.55228 7.44772 2 8 2H10.5858L4.29289 8.29289C3.90237 8.68342 3.90237 9.31658 4.29289 9.70711C4.68342 10.0976 5.31658 10.0976 5.70711 9.70711L12 3.41421V6C12 6.55228 12.4477 7 13 7C13.5523 7 14 6.55228 14 6V1C14 0.447715 13.5523 0 13 0H8Z"
                fill={props.fillColor}/>
            <path
                d="M2 2C0.895431 2 0 2.89543 0 4V12C0 13.1046 0.89543 14 2 14H10C11.1046 14 12 13.1046 12 12V9C12 8.44772 11.5523 8 11 8C10.4477 8 10 8.44772 10 9V12H2V4L5 4C5.55228 4 6 3.55228 6 3C6 2.44772 5.55228 2 5 2H2Z"
                fill={props.fillColor}/>
        </svg>
    </>
);