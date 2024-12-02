"use client";

import { useRouter } from "next/navigation";

interface CLickprops {
  id: string;
}

const Click: React.FC<CLickprops> = ({ id }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/watch?v=${id}`);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer text-blue-500">
      playvideo
    </div>
  );
};

export default Click;
