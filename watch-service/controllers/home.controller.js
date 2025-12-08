import { PrismaClient } from "@prisma/client"
import { indexVideo, partialSearch, searchVideos } from "../service/elasticSearch.js";


const getAllVideos = async (req, res) => {
  console.log("hello");
  const prisma = new PrismaClient();
  try {
    const allData = await prisma.video_data.findMany();
    console.log(allData);
    return res.status(200).send(allData);
  } catch (error) {
    console.log('Error fetching data:', error);
    return res.status(400).send();
  }
}

const getSearchVideos = async (req, res) => {
  try {
    const query = req.query.q;
    const videos = await searchVideos(query);
    return res.status(200).send(videos);
  }
  catch (error) {
    console.log('Error searching videos:', error);
    return res.status(500).send();
  }
}

const getPartialSearchVideos = async (req, res) => {
  try {
    const query = req.query.q;
    const videos = await partialSearch(query);
    return res.status(200).send(videos);
  }
  catch (error) {
    console.log('Error in partial search:', error);
    return res.status(500).send();
  }
}

export { getAllVideos, getSearchVideos, getPartialSearchVideos };