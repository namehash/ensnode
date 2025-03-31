import ensnode_video from "/ensnode_video.mp4";
import video_thumbnail from "../../assets/background_video_thumbnail_compressed.png"
import ensnode_video_rotated from "/ensnode-video-rotated.mp4";
import video_rotated_thumbnail from "../../assets/bacground_video_rotated_thumbnail_compressed.png";

export default function VideoBackground() {
  return (
      <>
        <video
            className="hidden sm:block z-0 w-full h-full object-cover rounded-lg"
            src={ensnode_video}
            autoPlay
            loop
            muted
            poster={video_thumbnail.src}
        />
        <video
            className="block sm:hidden z-0 w-[calc(100%-40px)] h-full object-cover rounded-lg"
            src={ensnode_video_rotated}
            autoPlay
            loop
            muted
            poster={video_rotated_thumbnail.src}
        />
      </>
  );
}
