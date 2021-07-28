import { makeStyles } from '@material-ui/core'
import React, { useState } from 'react'
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';

const useStyles = makeStyles({
    controllWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        "& svg": {
            color: "#fff"
        }
    }
})

const CustomController = ({ videoElement }) => {
    const classes = useStyles()

    const [played, setPlayed] = useState(false)
    const handlePlayButton = () => {
        videoElement.play()
        setPlayed(true)
    }

    const handlePauseButton = () => {
        videoElement.pause()
        setPlayed(false)

    }

    return (
        <div className={classes.controllWrapper}>
            <div>
                {
                    played ?
                        <PauseIcon onClick={handlePauseButton} />
                        :
                        <PlayArrowIcon onClick={handlePlayButton} />

                }
            </div>
            <progress id="progress" max="100" value="0">Progress</progress>
        </div>
    )
}

export default CustomController
