import test_video from "/node_bg_video.mp4";

export default function VideoBackground() {
    return <video className="rotate-90 sm:rotate-0 z-0 w-screen sm:w-full h-full object-cover" src={test_video} autoPlay loop muted/>
}