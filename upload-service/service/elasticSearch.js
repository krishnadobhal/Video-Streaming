import { esClient } from "./client.js";
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv";

dotenv.config();

export const esIndex = process.env.VIDEO_INDEX_NAME || "video_metadata_v2";
const prisma = new PrismaClient();

export async function SetupElasticsearch() {
    try {
        const exists = await esClient.indices.exists({ index: esIndex });

        if (exists) {
            console.log(`Elasticsearch index ${esIndex} already exists.`);
            return;
        }
        else {
            console.log(`Creating Elasticsearch index: ${esIndex}`);
            await esClient.indices.create({
                index: esIndex,
                body: {
                    mappings: {
                        properties: {
                            id: { type: "keyword" },
                            date: { type: "date" },
                            title: { type: "text" },
                            description: { type: "text" },
                            author: { type: "text" },
                            title_suggest: {
                                type: "completion"
                            }
                        }
                    }
                }
            });
        }

        console.log(`Index ${esIndex} created with autocomplete support ✅`);
    } catch (err) {
        console.error("Elasticsearch setup error:", err);
        throw err;
    }
}


export async function AddDataFromDatabase() {
    const data = await prisma.video_data.findMany();
    for (const video of data) {
        await indexVideo(video);
    }
}

export async function deleteIndex() {
    try {
        const exists = await esClient.indices.exists({ index: esIndex });
        if (exists) {
            await esClient.indices.delete({ index: esIndex });
            console.log(`Index ${esIndex} deleted.`);
        }
    } catch (err) {
        console.error("Error deleting index:", err);
    }
}

export async function indexVideo(video) {
    try {
        await esClient.index({
            index: esIndex,
            id: video.id,
            body: {
                id: video.id,
                date: video.date,
                title: video.title,
                description: video.description,
                author: video.author,
                title_suggest: video.title
            },
        });
    } catch (err) {
        console.error("Error indexing video:", err);
    }
}

export async function searchVideos(query) {
    try {
        const result = await esClient.search({
            index: esIndex,
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["title^3", "description^2", "author"],
                        type: "best_fields",
                        fuzziness: "AUTO",
                        operator: "or"
                    },
                },
            },
        });
        console.log("Search result:", result);
        return result.hits.hits.map(hit => hit._source);
    } catch (err) {
        console.error("Error searching videos:", err);
        return [];
    }
}

export async function allData() {
    const result = await esClient.search({
        index: esIndex,
        body: {
            query: {
                match_all: {}
            }
        }
    });

    const s = result.hits.hits.map(hit => hit._source);
    console.log("All data in Elasticsearch:", s);
}

export async function partialSearch(query) {
    try {
        if (!query || query.trim() === "") {
            return [];
        }

        const result = await esClient.search({
            index: esIndex,
            body: {
                suggest: {
                    title_suggest: {
                        prefix: query,
                        completion: {
                            field: "title_suggest",
                            size: 5
                        }
                    }
                }
            }
        });
        console.log("Partial search result:", result);
        const suggestions =
            result.suggest.title_suggest[0].options.map(
                opt => opt._source.title
            );

        console.log("Elasticsearch suggestions:", suggestions);
        return suggestions;

    } catch (err) {
        console.error("Error in partial search:", err);
        return [];
    }
}   