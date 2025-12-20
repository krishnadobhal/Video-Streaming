"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function ResultsPage() {
    const router = useRouter();
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search_query") || "";
    const [videos, setVideos] = useState([]);
    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                const response = await axios.get(`http://localhost:8082/watch/search?query=${encodeURIComponent(searchQuery)}`);
                const data = response.data;
                setVideos(data);
            } catch (error) {
                console.error("Error fetching search results:", error);
            }
        };
        fetchSearchResults();
    }, [searchQuery]);
    console.log(videos);
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {videos.length === 0 ? (
                <div className="flex items-center justify-center h-screen">
                    <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video: any) => (
                        <div onClick={() => { router.push(`/watch?v=${video.id}`) }} key={video.id} className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={video.thumbnail || ""}
                                    alt={video.title || "Video thumbnail"}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="p-4 space-y-2">
                                <h2 className="text-base font-bold text-gray-800 line-clamp-2">{video.title}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
