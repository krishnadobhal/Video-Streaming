import { db } from "@/Server/index"
import Fullplayer from "../videoplayer/player"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function AllVideo(){
    const datas=await prisma.video_data.findMany({})
    console.log(datas)
    return (
        <div>
            Hello
            <div>
            {datas.map(data =>(
                <div key={data.id}>
                    {/* <Fullplayer link={data.url} /> */}
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-2">{data.title}</h2>
                        <p className="text-gray-700">Author - {data.author}</p>
                        <p className="text-gray-700">{data.description}</p>
                    </div>
                </div>
            ))}
            </div>
        </div>
    )
}