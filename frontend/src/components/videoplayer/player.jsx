"use client"
import VideoPlayer from './videoplayer'
import { useRef,useState, useEffect } from 'react'
import {useSearchParams} from "next/navigation"
import axios from 'axios'

const Fullplayer=() =>{
    
    // const session=useSession()
    const id=useSearchParams().get("v")
    // const filename=useSearchParams().get("file")
    // const key="hls/output/11d7d5df-10b6-4a60-859a-d7dfd1503613/testing_master.m3u8"
    // const key=`hls/output/${author}/${filename}/${filename}_master.m3u8`
    // `${hlsFolder}/${author}/${file}
    const playerRef = useRef(null)
    const [video,setvideo]=useState()
    // const videoLink = link
    useEffect(() => {
        // Fetch video data
        const fetchVideo = async () => {
            const res = await axios.get("http://localhost:8082/watch", {
                params: { key: id },
            });
            setvideo(res.data.signedUrl);
            console.log(res.data.signedUrl)
        };
        fetchVideo();

        // Clean up video.js player on unmount
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose(); // Properly dispose of the player
                playerRef.current = null;
            }
        };
    }, []);

    const videoPlayerOptions = {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
            {
                src: video,
                type: "application/x-mpegURL"
            }
        ]
    }
    const handlePlayerReady = (player) => {
        playerRef.current = player;

        // You can handle player events here, for example:
        player.on("waiting", () => {
            videojs.log("player is waiting");
        });

        player.on("dispose", () => {
            videojs.log("player will dispose");
        });
    };
    return (
        <>
            <div>
                <h1>hello</h1>
            </div>
            <VideoPlayer
                options={videoPlayerOptions}
                onReady={handlePlayerReady}
            />
        </>
    )
}

export default Fullplayer