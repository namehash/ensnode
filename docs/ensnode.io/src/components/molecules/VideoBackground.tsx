import ensnode_video from "/ensnode_video.mp4";

export default function VideoBackground() {
  return (
    <video
      className="rotate-90 sm:rotate-0 z-0 w-screen sm:w-full h-full object-cover"
      src={ensnode_video}
      autoPlay
      loop
      muted
    />
  );
}
