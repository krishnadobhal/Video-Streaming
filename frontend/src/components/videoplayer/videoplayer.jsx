import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady, streamToken } = props;

  // 1) Init player once
  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          ...options,
          html5: {
            ...options.html5,
            vhs: {
              ...(options.html5?.vhs || {}),
            },
          },
        },
        () => {
          videojs.log("player is ready");
          if (onReady) {
            onReady(player);
          }
        }
      ));
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !streamToken) return;

    const applyBeforeRequest = () => {
      const tech = player.tech(true);
      if (!tech || !tech.vhs || !tech.vhs.xhr) return;

      tech.vhs.xhr.beforeRequest = (opts) => {
        try {
          const url = new URL(opts.uri);

          if (!url.searchParams.has("token")) {
            url.searchParams.set("token", streamToken);
            opts.uri = url.toString();
          }
        } catch (e) {
          // Fallback: simple query append if URL parsing fails
          console.error("Error parsing URL:", e);
          const separator = opts.uri.includes("?") ? "&" : "?";
          if (!opts.uri.includes("token=")) {
            opts.uri = `${opts.uri}${separator}token=${streamToken}`;
          }
        }

        return opts;
      };
    };

    if (player.isReady_) {
      applyBeforeRequest();
    } else {
      player.ready(applyBeforeRequest);
    }
  }, [streamToken]);

  // 3) Dispose on unmount
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player style={{ width: "600px" }}>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
