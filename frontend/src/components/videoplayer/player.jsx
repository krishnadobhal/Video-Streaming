"use client"
import VideoPlayer from './videoplayer'
import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from "next/navigation"
import axios from 'axios'

const Fullplayer = () => {
  const id = useSearchParams().get("v")
  const playerRef = useRef(null)
  const [video, setVideo] = useState()
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get("http://localhost:8082/watch", { 
          params: { key: id }, 
        });
        
        if (res.data && res.data.signedUrl) {
          setVideo(res.data.signedUrl);
          console.log("Signed URL:", res.data.signedUrl);
        } else {
          setError("No video URL found");
        }
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to fetch video");
      }
    };

    if (id) {
      fetchVideo();
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [id]);

  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: video ? [{ 
      src: video, 
      type: "application/x-mpegURL" 
    }] : []
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    
    // Add event listeners for debugging
    player.on("error", (error) => {
      console.error("Video.js player error:", error);
    });
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!video) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <VideoPlayer 
        options={videoPlayerOptions} 
        onReady={handlePlayerReady} 
      />
    </div>
  );
};

export default Fullplayer;