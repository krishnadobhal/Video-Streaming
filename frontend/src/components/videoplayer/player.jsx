"use client"
import VideoPlayer from './videoplayer'
import { useRef } from 'react'

const Fullplayer=() =>{
    const playerRef = useRef(null)
    const videoLink = "https://yt-krishna.s3.ap-south-1.amazonaws.com/hls/output/3f5a5216-b06c-43ec-a9a9-e1c196368503/test3_master.m3u8"

    const videoPlayerOptions = {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
            {
                src: videoLink,
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