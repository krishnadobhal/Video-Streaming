"use client"
import VideoPlayer from './videoplayer'
import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from "next/navigation"
import axios from 'axios'

const HLS_BASE_URL =
  process.env.NEXT_PUBLIC_WATCH_BASE_URL || "http://localhost:8082";

const Fullplayer = () => {
  const id = useSearchParams().get("v")
  const playerRef = useRef(null);
  const [streamToken, setStreamToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStreamToken = async () => {
      if (!id) return;
      
      try {
        const response = await axios.get(`${HLS_BASE_URL}/watch/stream/${id}/token`);
        setStreamToken(response.data.token);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stream token:", err);
        setError("Failed to authenticate for video streaming");
        setLoading(false);
      }
    };

    fetchStreamToken();
  }, [id]);

  if (!id) {
    return <div>No video ID provided</div>;
  }

  if (loading) {
    return <div>Loading video...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const masterUrl = `${HLS_BASE_URL}/watch/stream/${id}/master.m3u8?token=${streamToken}`;

  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: masterUrl,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // Add event listeners for debugging
    player.on("error", (error) => {
      console.error("Video.js player error:", error);
    });
  };

  return (
    <div>
      <VideoPlayer
        options={videoPlayerOptions}
        onReady={handlePlayerReady}
        streamToken={streamToken}
      />
    </div>
  );
};

export default Fullplayer;