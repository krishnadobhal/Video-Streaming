import Nav from "@/components/navigation/nav";
import Image from "next/image";
import Fullplayer from "@/components/videoplayer/player"
import UploadForm from "@/components/upload/page";

export default function Home() {
  return (
    <div>
      {/* <Fullplayer/> */}
      <UploadForm/>
    </div>
  );
}
