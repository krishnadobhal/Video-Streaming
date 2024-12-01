
import Fullplayer from "@/components/videoplayer/player"
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <Fullplayer />
    </div>
  );
}
