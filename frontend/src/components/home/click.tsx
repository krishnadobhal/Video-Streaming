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
    <div 
      onClick={handleClick} 
      className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 ease-in-out cursor-pointer font-medium text-sm shadow-sm hover:shadow-md"
    >
      Play Video
    </div>
  );
};

export default Click;
