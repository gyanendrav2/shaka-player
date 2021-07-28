import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import ReactHtmlParser from "react-html-parser";
import shaka from "shaka-player/dist/shaka-player.ui";
import CustomController from "./CustomController";
import { htmlData } from "./data/htmlData";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  wrapper: {
    "& .video_container": {
      position: "relative",
    },
  },
});

function Solution() {
  const classes = useStyles();
  function initApp() {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
      // Everything looks good!
      initPlayer();
    } else {
      // This browser does not have the minimum set of APIs we need.
      console.error("Browser not supported!");
    }
  }

  async function initPlayer() {
    // getting all the videos elements from the rendered HTML
    const videoElements = document.querySelectorAll("video");

    // iterating earch elements and making controls false if default video element has controller to set our
    // own custom controller

    videoElements.forEach(async (item, i) => {
      item.controls = false;

      // creating custom element to wrap the video element in the wrapper for the controller. so that
      // we can assign unique controller to every element
      const newDiv = document.createElement("div");
      newDiv.setAttribute("id", "video_wrapper_" + i);
      newDiv.setAttribute("class", "video_container");

      wrap(item, newDiv);
      const element = document.getElementById("video_wrapper_" + i);
      const controllWrapper = document.createElement("div");
      controllWrapper.setAttribute("id", "controll_wrapper_" + i);
      element.appendChild(controllWrapper);

      // adding custom controller in the video element wrapper
      ReactDOM.render(
        <CustomController videoElement={item} />,
        document.getElementById(`controll_wrapper_${i}`)
      );

      // assigning video element to shaka player
      const player = new shaka.Player(item);

      //   // Fetch a paticular part of video
      // player.configure({
      //   playRangeStart: startSeekTime,
      //   playRangeEnd: endSeekTime,
      // });

      // // Add streaming, adaptibe bitrate, drm configurations to player
      // player.configure({
      //   streaming: { ...streamingConfig },
      //   restrictions: { ...restrictions },
      //   abr: { ...abrConfig },
      //   drm: { ...drmConfig },
      // });

      // Listen for error events.
      player.addEventListener("error", onErrorEvent);

      try {
        // assigning the html video element src to the shaka-player
        await player.load(item.src);
        // This runs if the asynchronous load is successful.
        console.log("The video has now been loaded!");
      } catch (e) {
        // onError is executed if the asynchronous load fails.
        onError(e);
      }
    });
  }

  function wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    onError(event.detail);
  }

  function onError(error) {
    // Log the error.
    console.error("Error code", error.code, "object", error);
  }

  useEffect(() => {
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={classes.wrapper}>{ReactHtmlParser(htmlData)}</div>;
}

export default Solution;
