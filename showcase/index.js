import { delay, setLengthDisplay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Current Mod ID
const currentModIdEl = document.getElementById("current-mod-id")

// Metadata
const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
const nowPlayingMapperEl = document.getElementById("now-playing-mapper")
const nowPlayingReplayerEl = document.getElementById("now-playing-replayer")
let currentMapId, currentMapChecksum, updateStats = false, currentReplayer
// Stats
const nowPlayingSongLengthEl = document.getElementById("now-playing-song-length")
const nowPlayingBpmNumberEl = document.getElementById("now-playing-bpm-number")
const nowPlayingSrEl = document.getElementById("now-playing-sr")
const nowPlayingCsEl = document.getElementById("now-playing-cs")
const nowPlayingArEl = document.getElementById("now-playing-ar")
const nowPlayingOdEl = document.getElementById("now-playing-od")

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    if (currentMapId !== data.beatmap.id || currentMapChecksum !== data.beatmap.checksum) {
        currentMapId = data.beatmap.id
        currentMapChecksum = data.beatmap.checksum

        // Metadata
        const bg = data.directPath.beatmapBackground.replace(/\\/g, "/").replace(/[\u0000-\u001F\u007F]/g, "")
        nowPlayingBackgroundEl.setAttribute("src", `http://127.0.0.1:24050/Songs/${bg}`)
        nowPlayingArtistEl.textContent = data.beatmap.artist
        nowPlayingTitleEl.textContent = data.beatmap.title
        nowPlayingDifficultyEl.textContent = data.beatmap.version
        nowPlayingMapperEl.textContent = data.beatmap.mapper

        // Setting update stats
        await delay(250)
        updateStats = true
    }

    // Update stats
    if (updateStats) {
        updateStats = false
        nowPlayingSongLengthEl.textContent = setLengthDisplay(Math.round((data.beatmap.time.lastObject-  data.beatmap.time.firstObject) / 1000))
        nowPlayingBpmNumberEl.textContent = Math.round(data.beatmap.stats.bpm.common)
        nowPlayingSrEl.textContent = data.beatmap.stats.stars.total.toFixed(2)
        nowPlayingCsEl.textContent = data.beatmap.stats.cs.converted.toFixed(1)
        nowPlayingArEl.textContent = data.beatmap.stats.ar.converted.toFixed(1)
        nowPlayingOdEl.textContent = data.beatmap.stats.od.converted.toFixed(1)
    }

    // Update replayer
    const currentPlayer = data.resultsScreen.playerName ?? data.play.playerName
    if (currentReplayer !== currentPlayer) {
        currentReplayer = currentPlayer
        nowPlayingReplayerEl.textContent = currentReplayer
    }
}