import AllVideo from "@/components/home/page";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <SessionProvider >
        <AllVideo />
      </SessionProvider >
    </div>
  );
}
