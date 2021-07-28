import React, { useEffect, useRef, useState, forwardRef } from "react";
import shaka from "shaka-player/dist/shaka-player.ui";
import { Container, makeStyles } from "@material-ui/core";
// import PlayerControls from "./PlayerControls";

const useStyles = makeStyles(() => ({
  controlsContainer: {
    position: "relative",
    width: "100%",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
  },
}));

const VideoPlayer = ({
  src,
  licenseKey,
  authToken,
  startSeekTime,
  endSeekTime,
  streamingConfig,
  abrConfig,
  drmConfig,
  restrictions,
  onVideoEnd,
  removeRightClick,
  disableControls,
  disableConsoleControls,
  containerStyle,
}) => {
  const classes = useStyles();
  const videoRef = useRef(null);
  const videoDuration = endSeekTime - startSeekTime;
  const [videoFetched, setVideoFetched] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [fullScreen, setFullScreen] = useState(false);
  const onError = (error) => {
    console.error("Error code", error.code, "object", error);
  };

  const onErrorEvent = (event) => {
    onError(event.detail);
  };

  const initPlayer = () => {
    const video = videoRef.current;
    setTimeout(() => {
      const elements = document.querySelector("video");
      console.log("videoElements", elements);
    }, 2000);

    const player = new shaka.Player(video);
    player.addEventListener("error", onErrorEvent);

    // Fetch a paticular part of video
    player.configure({
      playRangeStart: startSeekTime,
      playRangeEnd: endSeekTime,
    });

    // Add streaming, adaptibe bitrate, drm configurations to player
    player.configure({
      streaming: { ...streamingConfig },
      restrictions: { ...restrictions },
      abr: { ...abrConfig },
      drm: { ...drmConfig },
    });

    // Get API call to fetch video segments and and Post API call to fetch
    // the decryption key to play the video
    player.getNetworkingEngine().registerRequestFilter((type, request) => {
      if (type === 2) {
        request.uris[0] += `/${licenseKey}`;
        request.headers["Content-Type"] = "application/octet-stream";
        request.headers.Authorization = `Bearer ${authToken}`;
      }
    });

    // Start seek time is added for safari as it does not
    // set the video's current time to start time using config method
    player
      .load(src, startSeekTime)
      .then(() => {
        console.log("video loaded");
      })
      .catch(onError);

    video.onloadeddata = () => {
      console.log("video data loaded");
      setVideoFetched(true);
    };

    video.onloadedmetadata = () => {
      if (startSeekTime >= 0 && startSeekTime > video.duration && onVideoEnd) {
        onVideoEnd();
      }
    };

    if (disableControls) {
      if (removeRightClick) {
        video.addEventListener(
          "contextmenu",
          (e) => {
            e.preventDefault();
          },
          false
        );
      }
      if (disableConsoleControls) {
        video.addEventListener("pause", () => {
          video.play();
        });
      }
    }
  };

  const initApp = () => {
    // shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
      initPlayer();
    } else {
      console.error("Browser not supported!");
    }
  };

  useEffect(() => {
    initApp();
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        setFullScreen(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 250);
  }, [fullScreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (video.duration && startSeekTime >= 0) {
      if (startSeekTime > video.duration && onVideoEnd) {
        onVideoEnd();
      } else if (disableControls) {
        video.currentTime = startSeekTime;
        video.play();
      }
    }
  }, [startSeekTime, onVideoEnd, disableControls]);

  const formatVideoTime = (seconds) => {
    if (!seconds) {
      return "00:00";
    }
    const hh = parseInt(seconds / 3600, 10);
    const mm = parseInt((seconds % 3600) / 60, 10);
    const ss = ((seconds % 3600) % 60).toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Functions to handle the video controls
  const replayVideo = () => {
    videoRef.current.currentTime = startSeekTime;
    setPlaying(true);
    setEnded(false);
    setPlayed(0);
    videoRef.current.play();
  };

  const playVideo = () => {
    setPlaying(true);
    videoRef.current.play();
  };

  const pauseVideo = () => {
    setPlaying(false);
    videoRef.current.pause();
  };

  const endVideo = () => {
    setPlaying(false);
    setEnded(true);
    videoRef.current.pause();
  };

  const muteVideo = () => {
    setMuted(true);
    setVolume(0);
    videoRef.current.volume = 0;
  };

  const unmuteVideo = () => {
    setMuted(false);
    setVolume(0.5);
    videoRef.current.volume = 0.5;
  };

  const onVideoFullScreen = () => {
    setFullScreen(true);
    setLoaded(false);
    const elem = videoRef.current;
    if (elem.requestFullscreen) {
      elem.parentNode.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.parentNode.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.parentNode.msRequestFullscreen();
    }
  };

  const onVideoExitFullScreen = () => {
    setFullScreen(false);
    setLoaded(false);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
      setLoaded(false);
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
  };

  const handleVideoProgress = () => {
    const currentDuration = videoRef.current.currentTime - startSeekTime;
    if (!seeking) {
      const checkVideoDurationinDecimals = videoRef.current.duration % 1 > 0.5;
      const videoCurrTime = checkVideoDurationinDecimals
        ? Math.round(videoRef.current.currentTime)
        : videoRef.current.currentTime;
      if (videoCurrTime >= endSeekTime) {
        endVideo();
      }
      if (
        parseInt(played, 10) !==
        parseInt((currentDuration / videoDuration) * videoDuration, 10)
      ) {
        setPlayed((currentDuration / videoDuration) * videoDuration);
      }
    }
  };

  const onVideoDurationChange = (e, newVal) => {
    setPlayed(newVal);
  };

  const handleVideoSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleVideoSeekMouseUp = (e, newVal) => {
    setSeeking(false);
    videoRef.current.currentTime =
      startSeekTime + parseFloat(newVal / videoDuration) * videoDuration;
    if (ended && videoRef.current.currentTime < endSeekTime) {
      setEnded(false);
    }
  };

  const onVideoVolumeChange = (e, newVal) => {
    const vol = parseFloat(newVal / 100);
    setVolume(vol);
    if (newVal === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
  };

  const handleVideoVolumeSeekDown = (e, newVal) => {
    const vol = parseFloat(newVal / 100);
    setVolume(vol);
    if (newVal === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
    videoRef.current.volume = vol;
  };

  let videoElapsedTime = "00:00";
  if (videoRef && videoRef.current) {
    const videoSeekTime = parseFloat(played / videoDuration) * videoDuration;
    videoElapsedTime = formatVideoTime(parseInt(videoSeekTime, 10));
  }

  return (
    <Container maxWidth="md" className={containerStyle}>
      <div className={classes.controlsContainer}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className={classes.videoContainer}
          controls
          id="video"
          src={src}
          onTimeUpdate={handleVideoProgress}
        />
        {/* {loaded && videoFetched && !disableControls ? (
          <PlayerControls
            playing={playing}
            ended={ended}
            duration={endSeekTime - startSeekTime}
            timePlayed={played}
            volume={volume}
            muted={muted}
            fullScreen={fullScreen}
            videoElapsedTime={videoElapsedTime}
            videoDuration={formatVideoTime(parseInt(videoDuration, 10))}
            pauseVideo={pauseVideo}
            playVideo={playVideo}
            replayVideo={replayVideo}
            muteVideo={muteVideo}
            unmuteVideo={unmuteVideo}
            onVideoDurationChange={onVideoDurationChange}
            handleVideoSeekMouseDown={handleVideoSeekMouseDown}
            handleVideoSeekMouseUp={handleVideoSeekMouseUp}
            onVideoVolumeChange={onVideoVolumeChange}
            handleVideoVolumeSeekDown={handleVideoVolumeSeekDown}
            onVideoFullScreen={onVideoFullScreen}
            onVideoExitFullScreen={onVideoExitFullScreen}
          />
        ) : null} */}
      </div>
    </Container>
  );
};

export default forwardRef(VideoPlayer);
