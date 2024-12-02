import { db } from "@/Server/index"
import Fullplayer from "../videoplayer/player"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import Image from "next/image";
import Click from "./click";

export default async function AllVideo(){
    const datas=await prisma.video_data.findMany({})

    // console.log(datas)
    return (
        <div className="pt-12 pl-10">
            Youtube
            <div className="grid grid-cols-12">
            {datas.map(data =>(
                <div key={data.id} className="col-span-4">
                    {/* <Fullplayer link={data.url} /> */}
                    <Image src={data.thumbnail? data.thumbnail : ""} alt="none" width={300} height={200} />
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-2">{data.title}</h2>
                        <p className="text-gray-700">Author - {data.author}</p>
                        <p className="text-gray-700">{data.description}</p>
                    </div>
                    <Click id={data.id}/>
                </div>
            ))}
            </div>
        </div>
    )
}