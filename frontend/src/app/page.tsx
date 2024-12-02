
import Nav from "@/components/navigation/nav";
import Image from "next/image";
import Fullplayer from "@/components/videoplayer/player"
import UploadForm from "@/components/upload/page";
import AllVideo from "@/components/home/page";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <SessionProvider >
      {/* <Fullplayer /> */}
      <AllVideo/>
      </SessionProvider >
      {/* <AllVideo/> */}
    </div>
  );
}
