import cc from "classcat";

export type BlockchainElementProps = {
    imageSource?: string;
    svgInput?: React.ReactNode;
    styles?: string;
}

export default function BlockchainElement({styles, imageSource, svgInput} : BlockchainElementProps) {
    return <div className={cc(["not-content box-border w-fit h-fit max-w-[128px] max-h-[128px] border-black border-[12px] rounded-full p-1 bg-black", styles])}>
        {imageSource ?
            <img className="w-full max-w-[64px] h-full max-h-[64px]" src={imageSource} alt="blockchain icon"/> :
            (svgInput ? (svgInput) : <div className="bg-red-600 w-full h-full rounded-2xl"/>)
        }
    </div>
}