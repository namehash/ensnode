import ensnode_video from "/ensnode_video.mp4";
import ensnode_video_rotated from "/ensnode-video-rotated-test.mp4";

export default function VideoBackground() {
  return (
      <>
        <video
            className="hidden sm:block z-0 w-full h-full object-cover rounded-lg"
            src={ensnode_video}
            autoPlay
            loop
            muted
        />
        <video
            className="block sm:hidden z-0 w-[calc(100%-40px)] h-full object-cover rounded-lg"
            src={ensnode_video_rotated}
            autoPlay
            loop
            muted
        />
      </>
  );
}
