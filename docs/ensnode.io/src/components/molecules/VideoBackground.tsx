import test_video from "/node_bg_video.mp4";

export default function VideoBackground() {
    return <video className="z-0 w-full h-full object-cover" src={test_video} autoPlay loop muted/>
}