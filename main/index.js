import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { displayStars } from "../_shared/core/stars.js"
import { delay, getCookie } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

const roundNameEl = document.getElementById("round-name")
let allBeatmaps
Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    allBeatmaps = beatmaps.beatmaps
    roundNameEl.textContent = beatmaps.roundName.toUpperCase()
})

// Team Info
const teamRedPfpEl = document.getElementById("team-red-pfp")
const teamBluePfpEl = document.getElementById("team-blue-pfp")
const teamRedNameEl = document.getElementById("team-red-name")
const teamBlueNameEl = document.getElementById("team-blue-name")
let player1Id, player2Id

// Accuracy Difference
const accuracyDifferenceEl = document.getElementById("accuracy-difference")

// Star Containers
const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")
let currentRedTeamStars, currentBlueTeamStars, currentOsuBestOf, starsVisible

// Score Bar
const scoreBarLeftEl = document.getElementById("score-bar-left")
const scoreBarRightEl = document.getElementById("score-bar-right")
const scoreDifferenceLeftEl = document.getElementById("score-difference-left")
const scoreDifferenceRightEl = document.getElementById("score-difference-right")
const scoreLeftEl = document.getElementById("score-left")
const scoreRightEl = document.getElementById("score-right")
const crownLeftEl = document.getElementById("crown-left")
const crownRightEl = document.getElementById("crown-right")
let scoreVisible
let currentScoreLeft, currentScoreRight

const animation = {
    accuracyDifference: new CountUp(accuracyDifferenceEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "%"}),
    scoreLeft: new CountUp(scoreLeftEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreRight: new CountUp(scoreRightEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreDifferenceLeft: new CountUp(scoreDifferenceLeftEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", prefix: "-"}),
    scoreDifferenceRight: new CountUp(scoreDifferenceRightEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", prefix: "-"}), 
}

const bgMaskImageEl = document.getElementById("bg-mask-image")
const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
const nowPlayingModIdEl = document.getElementById("now-playing-mod-id")
const nowPlayingDetailsEl = document.getElementById("now-playing-details")
const nowPlayingStatsCsEl = document.getElementById("now-playing-stats-cs")
const nowPlayingStatsArEl = document.getElementById("now-playing-stats-ar")
const nowPlayingStatsOdEl = document.getElementById("now-playing-stats-od")
const nowPlayingStatsSrEl = document.getElementById("now-playing-stats-sr")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingDiffivultyEl = document.getElementById("now-playing-diffivulty")
const nowPlayingMapperNameEl = document.getElementById("now-playing-mapper-name")
let nowPlayingId, nowPlayingChecksum, updateStats = false

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    // console.log(data)

    // Save data
    const clients = data.tourney.clients
    const teamPoints = data.tourney.points
    const totalScores = data.tourney.totalScore
    const beatmapInfo = data.beatmap
    
    if (player1Id !== clients[0].user.id) {
        player1Id = clients[0].user.id
        teamRedPfpEl.style.backgroundImage = `url("https://a.ppy.sh/${player1Id}")`
        teamRedNameEl.innerText = clients[0].user.name
    }
    if (player2Id !== clients[1].user.id) {
        player2Id = clients[1].user.id
        teamBluePfpEl.style.backgroundImage = `url("https://a.ppy.sh/${player2Id}")`
        teamBlueNameEl.innerText = clients[1].user.name
    }

    // Accuracy
    animation.accuracyDifference.update(Math.abs(clients[0].play.accuracy - clients[1].play.accuracy))

    // Star visibility
    console.log(data)
    if (starsVisible !== data.tourney.starsVisible) {
        starsVisible = data.tourney.starsVisible
        if (starsVisible) {
            redTeamStarContainerEl.style.opacity = 1
            blueTeamStarContainerEl.style.opacity = 1
        } else {
            redTeamStarContainerEl.style.opacity = 0
            blueTeamStarContainerEl.style.opacity = 0
        }
    }

    // Star info
    if (currentOsuBestOf !== data.tourney.bestOF ||
        currentRedTeamStars !== teamPoints.left ||
        currentBlueTeamStars !== teamPoints.right
    ) {
        currentOsuBestOf = data.tourney.bestOF
        currentRedTeamStars = teamPoints.left
        currentBlueTeamStars = teamPoints.right
        displayStars(currentOsuBestOf, redTeamStarContainerEl, blueTeamStarContainerEl, currentRedTeamStars, currentBlueTeamStars)
    }

    // Score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        if (scoreVisible) {
            scoreBarLeftEl.style.opacity = 1
            scoreBarRightEl.style.opacity = 1
            scoreDifferenceLeftEl.style.opacity = 1
            scoreDifferenceRightEl.style.opacity = 1
            scoreLeftEl.style.opacity = 1
            scoreRightEl.style.opacity = 1
            crownLeftEl.style.opacity = 1
            crownRightEl.style.opacity = 1
        } else {
            scoreBarLeftEl.style.opacity = 0
            scoreBarRightEl.style.opacity = 0
            scoreDifferenceLeftEl.style.opacity = 0
            scoreDifferenceRightEl.style.opacity = 0
            scoreLeftEl.style.opacity = 0
            scoreRightEl.style.opacity = 0
            crownLeftEl.style.opacity = 0
            crownRightEl.style.opacity = 0
        }
    }

    // Scores
    if (scoreVisible) {
        // Update scores
        currentScoreLeft = totalScores.left
        currentScoreRight = totalScores.right
        animation.scoreLeft.update(currentScoreLeft)
        animation.scoreRight.update(currentScoreRight)

        // Update deltas
        // When transitioning these, use display instead of opacity for when scores flip
        const scoreDelta = Math.abs(currentScoreLeft - currentScoreRight)
        animation.scoreDifferenceLeft.update(scoreDelta)
        animation.scoreDifferenceRight.update(scoreDelta)

        // Score bar width
        const multiplier = 1
        const scoreBarMaxWidth = 960
		const scoreBarMaxDifference = 300000
        let scoreBarDifferencePercent = Math.min(scoreDelta / (scoreBarMaxDifference * multiplier), 1)
        let scoreBarRectangleWidth = Math.min(Math.pow(scoreBarDifferencePercent, 1.4) * scoreBarMaxWidth, scoreBarMaxWidth)

        if (currentScoreLeft > currentScoreRight) {
            scoreBarLeftEl.style.width = `${scoreBarRectangleWidth}px`
            scoreBarRightEl.style.width = "0px"

            scoreDifferenceLeftEl.style.display = "none"
            scoreDifferenceRightEl.style.display = "block"

            scoreLeftEl.classList.add("score-leading")
            scoreRightEl.classList.remove("score-leading")

            crownLeftEl.style.display = "block"
            crownRightEl.style.display = "none"
        } else if (currentScoreLeft === currentScoreRight) {
            scoreBarLeftEl.style.width = `0px`
            scoreBarRightEl.style.width = "0px"

            scoreDifferenceLeftEl.style.display = "none"
            scoreDifferenceRightEl.style.display = "none"

            scoreLeftEl.classList.remove("score-leading")
            scoreRightEl.classList.remove("score-leading")

            crownLeftEl.style.display = "none"
            crownRightEl.style.display = "none"
        } else {
            scoreBarLeftEl.style.width = "0px"
            scoreBarRightEl.style.width = `${scoreBarRectangleWidth}px`

            scoreDifferenceLeftEl.style.display = "block"
            scoreDifferenceRightEl.style.display = "none"

            scoreLeftEl.classList.remove("score-leading")
            scoreRightEl.classList.add("score-leading")

            crownLeftEl.style.display = "none"
            crownRightEl.style.display = "block"
        }
    }

    // Now Playing Information
    if ((nowPlayingId !== beatmapInfo.id || nowPlayingChecksum !== beatmapInfo.checksum) && allBeatmaps) {
        nowPlayingId = beatmapInfo.id
        nowPlayingChecksum = beatmapInfo.checksum

        const imageLink = `${window.location.origin}/Songs/${data.folders.beatmap}/${data.files.background}`
        bgMaskImageEl.setAttribute("src", imageLink)
        nowPlayingBackgroundEl.style.backgroundImage = `url("${imageLink}")`
        nowPlayingArtistEl.textContent = `${beatmapInfo.artist}`
        nowPlayingTitleEl.textContent = `${beatmapInfo.title}`
        nowPlayingDiffivultyEl.textContent = `[${beatmapInfo.version}]`
        nowPlayingMapperNameEl.textContent = `${beatmapInfo.mapper}`

        const currentMap = findBeatmap(nowPlayingId)
        if (currentMap) {
            nowPlayingModIdEl.style.display = "block"
            nowPlayingDetailsEl.style.top = "40px"
            nowPlayingDetailsEl.style.transform = "translateX(-50%)"

            // Set Stats Variable
            let currentSr = Math.round(Number(currentMap.difficultyrating) * 100) / 100
            let currentCs = Math.round(Number(currentMap.diff_size) * 10) / 10
            let currentAr = Math.round(Number(currentMap.diff_approach) * 10) / 10
            let currentOd = Math.round(Number(currentMap.diff_overall) * 10) / 10
            // let currentBpm = Number(currentMappoolBeatmap.bpm)
            // let currentLength = Number(currentMappoolBeatmap.hit_length)

            switch (currentMappoolBeatmap.mod) {
                case "HR":
                    currentCs = Math.min(Math.round(Number(currentMappoolBeatmap.diff_size) * 1.3 * 10) / 10, 10)
                    currentAr = Math.min(Math.round(Number(currentMappoolBeatmap.diff_approach) * 1.4 * 10) / 10, 10)
                    currentOd = Math.min(Math.round(Number(currentMappoolBeatmap.diff_overall) * 1.4 * 10) / 10, 10)
                    break
                case "DT":
                    if (currentAr > 5) currentAr = Math.round((((1200 - (( 1200 - (currentAr - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
                    else currentAr = Math.round((1800 - ((1800 - currentAr * 120) * 2 / 3)) / 120 * 10) / 10
                    currentOd = Math.round((79.5 - (( 79.5 - 6 * currentOd) * 2 / 3)) / 6 * 10) / 10
                    // currentBpm = Math.round(currentBpm * 1.5)
                    // currentLength = Math.round(currentLength / 1.5)
                    break
                case "EZ":
                    currentCs /= 2
                    currentAr /= 2
                    currentOd /= 2
            }

            nowPlayingStatsCsEl.textContent = `${currentCs}`
            nowPlayingStatsArEl.textContent = `${currentAr}`
            nowPlayingStatsOdEl.textContent = `${currentOd}`
            nowPlayingStatsSrEl.textContent = `${currentSr}`
            updateStats = false
        } else {
            nowPlayingModIdEl.style.display = "none"
            nowPlayingDetailsEl.style.top = "50%"
            nowPlayingDetailsEl.style.transform = "translate(-50%, -50%)"

            await delay(250)
            updateStats = true
        }
    }

    if (updateStats) {
        const beatmapStats = data.beatmap.stats
        nowPlayingStatsCsEl.textContent = beatmapStats.cs.converted
        nowPlayingStatsArEl.textContent = beatmapStats.ar.converted
        nowPlayingStatsOdEl.textContent = beatmapStats.od.converted
        nowPlayingStatsSrEl.textContent = beatmapStats.stars.total
    }
}

// NP Pick
const npPickEl = document.getElementById("np-pick")
let currentPicker, previousPicker

// Current Picks
const historyPanelLeftEl = document.getElementById("history-panel-left")
const historyPanelRightEl = document.getElementById("history-panel-right")
let currentPicks, previousPicks 
let currentPickers, previousPickers 
let currentWinners, previousWinners 
setInterval(() => {
    currentPicker = getCookie("currentPicker")
    if (previousPicker !== currentPicker) {
        previousPicker = currentPicker
        if (currentPicker !== "none") {
            npPickEl.style.display = "block"
            npPickEl.setAttribute("src", `static/np-pick/np-${currentPicker}-pick.png`)
        } else {
            npPickEl.style.display = "none"
        }
    }

    currentPicks = getCookie("currentPicks")
    currentPickers = getCookie("currentPickers")
    currentWinners = getCookie("currentWinners")

    if (currentPicks !== previousPicks ||
        currentPickers !== previousPickers ||
        currentWinners !== previousWinners) {
        historyPanelLeftEl.innerHTML = ""
        historyPanelRightEl.innerHTML = ""
        
        // Set previous info
        previousPicks = currentPicks 
        previousPickers = currentPickers 
        previousWinners = currentWinners
        
        // Use Arrays
        const currentPicksArray = currentPicks.split(",")
        const currentPickersArray = currentPickers.split(",")
        const currentWinnersArray = currentWinners.split(",")
        for (let i = 0; i < currentPickersArray.length; i++) {
            if (!currentPicksArray[i] || !currentPickersArray[i]) continue
            const currentPanel = currentPickersArray[i] === "red" ? historyPanelLeftEl : currentPickersArray[i] === "blue" ? historyPanelRightEl : ""
            if (currentPanel === "") continue

            const panelCard = createPanelCard(currentPicksArray[i], currentWinnersArray[i])
            if (panelCard) currentPanel.append(panelCard)
        }

        console.log(currentPicks, currentPickers, currentWinners)
    }
}, 200)

// Create Panel
function createPanelCard(currentId, currentWinner) {
    const currentMap = findBeatmap(Number(currentId))
    if (!currentMap) return

    const historyPanelCard = document.createElement("div")
    historyPanelCard.classList.add("history-panel-card")

    const historyPanelModId = document.createElement("img")
    historyPanelModId.classList.add("history-panel-mod-id")
    historyPanelModId.setAttribute("src", `../_shared/assets/mods/${currentMap.mod}${currentMap.order}.png`)

    const historyPanelWin = document.createElement("img")
    historyPanelWin.classList.add("history-panel-win")
    if (currentWinner) {
        historyPanelWin.setAttribute("src", `static/history-pick/history-${currentWinner}-pick.png`)
    }

    historyPanelCard.append(historyPanelModId, historyPanelWin)
    return historyPanelCard
}