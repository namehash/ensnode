import { Button, Link } from "@namehash/namekit-react";

export type ButtonIslandProps = {
    text: string;
    size: "small" | "medium" | "large"
    linkData?: {
        link: string;
        target?: string;
    }
    styles?: string;
}

export default function SecondaryButtonIsland({text, size, linkData, style}: ButtonIslandProps){
    return (linkData != undefined ? (
            <Button variant="secondary" size={size} asChild className={style}>
                <Link target={linkData?.target || "_blank"} href={linkData.link}>
                    {text}
                </Link>
            </Button>
        ) : (
        <Button variant="secondary" size={size} className={style}>
            {text}
        </Button>
    ))
}