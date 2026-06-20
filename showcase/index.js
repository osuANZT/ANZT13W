import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Current Mod ID
const currentModIdEl = document.getElementById("current-mod-id")

// Metadata
const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
let currentMapId, currentMapChecksum

const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    if (currentMapId !== data.beatmap.id || currentMapChecksum !== data.beatmap.checksum) {
        currentMapId = data.beatmap.id
        currentMapChecksum = data.beatmap.checksum

        const bg = data.directPath.beatmapBackground.replace(/\\/g, "/").replace(/[\u0000-\u001F\u007F]/g, "")
        nowPlayingBackgroundEl.setAttribute("src", `http://127.0.0.1:24050/Songs/${bg}`)
        nowPlayingArtistEl.textContent = data.beatmap.artist
        nowPlayingTitleEl.textContent = data.beatmap.title
        nowPlayingDifficultyEl.textContent = data.beatmap.version
    }
}