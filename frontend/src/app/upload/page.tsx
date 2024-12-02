
import UploadForm from "@/components/upload/page";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <SessionProvider >
      <UploadForm/>
      </SessionProvider >
    </div>
  );
}
