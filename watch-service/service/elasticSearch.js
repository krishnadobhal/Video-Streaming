import { esClient } from "./client.js";

export const esIndex = "video_metadata";

export async function SetupElasticsearch() {
    try {
        const existsResp = await esClient.indices.exists({ index: esIndex });
        const exists = typeof existsResp === "boolean" ? existsResp : (existsResp).body;

        if (!exists) {
            console.log(`Creating Elasticsearch index: ${esIndex}`);
            await esClient.indices.create({
                index: esIndex,
                body: {
                    mappings: {
                        properties: {
                            date: { type: "date" },
                            title: { type: "text" },
                            description: { type: "text" },
                            author: { type: "text" },
                        },
                    },
                },
            });
            console.log(`Index ${esIndex} created.`);
        } else {
            console.log(` Elasticsearch index ${esIndex} already exists.`);
        }
    } catch (err) {
        console.error("Elasticsearch setup error:", err);
        throw err;
    }

}

export async function indexVideo(video) {
    try {
        await esClient.index({
            index: esIndex,
            id: video.id,
            body: {
                date: video.date,
                title: video.title,
                description: video.description,
                author: video.author,
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
            //all data
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["title", "description", "author"],
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

export async function partialSearch(query) {
    try {
        const result = await esClient.search({
            index: esIndex,
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["title", "description", "author"],
                        match_phrase_prefix: true
                    }
                },
            },
        });
        return result.body.hits.hits.map(hit => hit._source);
    } catch (err) {
        console.error("Error in partial search:", err);
        return [];
    }
}