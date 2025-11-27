import { db } from "@/Server/index"
import Fullplayer from "../videoplayer/player"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import Image from "next/image";
import Click from "./click";

export default async function AllVideo(){
    const datas=await prisma.video_data.findMany({})

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20 px-4">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to YouTube</h1>
                    <p className="text-xl opacity-90">Discover amazing videos from creators worldwide</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {datas.map(data =>(
                <div key={data.id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="aspect-video relative overflow-hidden">
                        <Image 
                            src={data.thumbnail? data.thumbnail : ""} 
                            alt={data.title || "Video thumbnail"} 
                            width={300} 
                            height={200}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="p-4 space-y-2">
                        <h2 className="text-xl font-bold text-gray-800 line-clamp-2">{data.title}</h2>
                        <p className="text-sm font-medium text-gray-600">
                            <span className="text-purple-600">{data.author}</span>
                        </p>
                        <p className="text-gray-500 text-sm line-clamp-2">{data.description}</p>
                        <Click id={data.id}/>
                    </div>
                </div>
            ))}
                </div>
            </div>
        </div>
    )
}
