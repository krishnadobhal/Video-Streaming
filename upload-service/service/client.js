
import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export { esClient };