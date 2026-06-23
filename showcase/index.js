import { findShowcaseBeatmap, loadShowcaseBeatmaps } from "../_shared/core/beatmaps.js"
import { delay, setLengthDisplay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Set round name
let allBeatmaps
const roundNameEl = document.getElementById("round-name")
loadShowcaseBeatmaps().then((beatmaps) => {
	allBeatmaps = beatmaps
	roundNameEl.textContent = allBeatmaps.roundName
})

// Current Mod ID
const currentModIdEl = document.getElementById("current-mod-id")

// Previous Maps Wrapper
const previousMapsWrapperEl = document.getElementById("previous-maps-wrapper")

// Metadata
const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
const nowPlayingMapperEl = document.getElementById("now-playing-mapper")
const nowPlayingReplayerEl = document.getElementById("now-playing-replayer")
let currentMapId, currentMapChecksum, updateStats = false, currentReplayer, currentMap
// Stats
const nowPlayingSongLengthEl = document.getElementById("now-playing-song-length")
const nowPlayingBpmNumberEl = document.getElementById("now-playing-bpm-number")
const nowPlayingSrEl = document.getElementById("now-playing-sr")
const nowPlayingCsEl = document.getElementById("now-playing-cs")
const nowPlayingArEl = document.getElementById("now-playing-ar")
const nowPlayingOdEl = document.getElementById("now-playing-od")

// Strains
const progressChart = document.getElementById("progress")
let tempStrains, seek, fullTime
let onepart
let last_strain_update = 0

window.onload = function () {
	let ctx = document.getElementById('strain').getContext('2d')
	window.strainGraph = new Chart(ctx, config)

	let ctxProgress = document.getElementById('strain-progress').getContext('2d')
	window.strainGraphProgress = new Chart(ctxProgress, configProgress)
}

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    if ((currentMapId !== data.beatmap.id || currentMapChecksum !== data.beatmap.checksum) && currentMapId !== 0) {
		// Set previous map details
		if (currentMap) {
			// Create previous map container
			const previousMapContainer = document.createElement("div")
			previousMapContainer.classList.add("previous-map-container")
			previousMapContainer.style.backgroundImage = `url("${nowPlayingBackgroundEl.getAttribute("src")}")`

			const previousMapOverlay = document.createElement("div")
			previousMapOverlay.classList.add("previous-map-overlay")
			
			const previousMapModId = document.createElement("div")
			previousMapModId.classList.add("previous-map-mod-id")
			previousMapModId.textContent = currentModIdEl.textContent

			const previousMapArtist = document.createElement("div")
			previousMapArtist.classList.add("previous-map-metadata", "previous-map-artist", "color-949494")
			previousMapArtist.textContent = nowPlayingArtistEl.textContent

			const previousMapTitle = document.createElement("div")
			previousMapTitle.classList.add("previous-map-metadata", "previous-map-title")
			previousMapTitle.textContent = nowPlayingTitleEl.textContent

			previousMapContainer.append(previousMapOverlay, previousMapModId, previousMapArtist, previousMapTitle)
			previousMapsWrapperEl.append(previousMapContainer)
		}

		// Set variable details
        currentMapId = data.beatmap.id
        currentMapChecksum = data.beatmap.checksum

        // Metadata
        const bg = data.directPath.beatmapBackground.replace(/\\/g, "/").replace(/[^\x00-\x7F]/g, "")
        nowPlayingBackgroundEl.setAttribute("src", `http://127.0.0.1:24050/Songs/${bg}`)
        nowPlayingArtistEl.textContent = data.beatmap.artist
        nowPlayingTitleEl.textContent = data.beatmap.title
        nowPlayingDifficultyEl.textContent = data.beatmap.version
        nowPlayingMapperEl.textContent = data.beatmap.mapper

		// Set current mod id
		currentMap = findShowcaseBeatmap(`${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`)
		if (currentMap) {
			currentModIdEl.style.display = "block"
			currentModIdEl.classList.remove("current-mod-nm", "current-mod-hd", "current-mod-hr", "current-mod-dt", "current-mod-tb")
			currentModIdEl.textContent = `${currentMap.mod}${currentMap.order}`
			currentModIdEl.classList.add(`current-mod-${currentMap.mod.toLowerCase()}`)
		} else {
			currentModIdEl.style.display = "none"
		}

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

    // Calculate strain
    const series = data.performance.graph.series
    const maxLength = Math.max( series[0].data.length, series[1].data.length, series[2].data.length, series[3].data.length )
    const fullStrains = series[0].data.map((num, index) => {
        const val0 = (series[0].data.length === maxLength) ? num : 0
        const val1 = (series[1].data.length === maxLength) ? series[1].data[index] : 0
        const val2 = (series[2].data.length === maxLength) ? series[2].data[index] : 0
        const val3 = (series[3].data.length === maxLength) ? series[3].data[index] : 0

        return val0 + val1 + val2 + val3
    })

    if (tempStrains != JSON.stringify(fullStrains) && window.strainGraph) {
        tempStrains = JSON.stringify(fullStrains)
        if (fullStrains) {
            let temp_strains = smooth(fullStrains, 5)
			let new_strains = []
			for (let i = 0; i < 60; i++) {
				new_strains.push(temp_strains[Math.floor(i * (temp_strains.length / 60))])
			}
			new_strains = [0, ...new_strains, 0]

			config.data.datasets[0].data = new_strains
			config.data.labels = new_strains
			config.options.scales.y.max = Math.max(...new_strains)
			configProgress.data.datasets[0].data = new_strains
			configProgress.data.labels = new_strains
			configProgress.options.scales.y.max = Math.max(...new_strains)
			window.strainGraph.update()
			window.strainGraphProgress.update()
        } else {
			config.data.datasets[0].data = []
			config.data.labels = []
			configProgress.data.datasets[0].data = []
			configProgress.data.labels = []
			window.strainGraph.update()
			window.strainGraphProgress.update()
		}
    }

    let now = Date.now()
	if (fullTime !== data.beatmap.time.lastObject) {
        fullTime = data.beatmap.time.lastObject
        onepart = 275 / fullTime
    }

	if (seek !== data.beatmap.time.live && fullTime && now - last_strain_update > 300) {
		last_strain_update = now
		seek = data.beatmap.time.live

		if (data.state.number !== 2) {
			progressChart.style.maskPosition = '-275px 0px'
			progressChart.style.webkitMaskPosition = '-275px 0px'
		}
		else {
			let maskPosition = `${-275 + onepart * seek}px 0px`
			progressChart.style.maskPosition = maskPosition
			progressChart.style.webkitMaskPosition = maskPosition
		}
	}
}

// Configs are for strain graphs
let config = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
            borderWidth: 2,
			borderColor: 'rgba(255, 255, 255, 1)',
			backgroundColor: 'rgba(0, 0, 0, 0)',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}

let configProgress = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			backgroundColor: 'white',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}