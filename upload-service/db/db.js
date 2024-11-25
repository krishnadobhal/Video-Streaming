import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function addVideoDetailsToDB(title, description, author, url) {
    const videoData = await prisma.video_data.create({
     data: {
         title: title,
         description: description,
         author: author,
         url: url
     } })
    console.log(videoData);
   }
   