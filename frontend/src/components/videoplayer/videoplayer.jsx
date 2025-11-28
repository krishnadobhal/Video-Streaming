import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady, streamToken } = props;

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      // Configure HLS options to include token in all segment requests
      const playerOptions = {
        ...options,
        html5: {
          vhs: {
            // Override the default xhr function to append token to all requests
            beforeRequest: streamToken ? (opts) => {
              try {
                // Handle both absolute and relative URLs
                const baseUrl = window.location.origin;
                const url = new URL(opts.uri, baseUrl);
                if (!url.searchParams.has('token')) {
                  url.searchParams.set('token', streamToken);
                  opts.uri = url.toString();
                }
              } catch {
                // If URL parsing fails, append token as query string
                const separator = opts.uri.includes('?') ? '&' : '?';
                opts.uri = `${opts.uri}${separator}token=${streamToken}`;
              }
              return opts;
            } : undefined
          }
        }
      };

      const player = (playerRef.current = videojs(videoElement, playerOptions, () => {
        videojs.log("player is ready");
        onReady && onReady(player);
      }));

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current;

      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef, streamToken]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div
      data-vjs-player
      style={{ width: "600px" }}
    >
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;