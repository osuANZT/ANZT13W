import { getLogsApi, sendLog, initialiseLogsApi } from "../_shared/core/apis.js"
import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { updateChat } from "../_shared/core/chat.js"
import { loadMatches, findMatch } from "../_shared/core/matches.js"
import { toggleStars, setDefaultStarCount, updateStarCount, isStarOn } from "../_shared/core/stars.js"
import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { getCookie } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Star Containers
const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")

// Pick Container
const pickContainerEl = document.getElementById("pick-container")

// Mappool Management Maps
const mappoolManagementMapsEl = document.getElementById("mappool-management-maps")

// Match Select
const matchSelectEl = document.getElementById("match-select")

// Load mappool
let bestOf = 0
let banCount = 2
const roundNameEl = document.getElementById("round-name")
let allBeatmaps = []
let allTeams = []

// Pick array
let currentPickArray, previousPickArray
let currentWinnerArray, previousWinnerArray

Promise.all([loadBeatmaps(), loadTeams(), loadMatches(), initialiseLogsApi()]).then(([beatmaps, teams, matches]) => {
    // Load beatmaps
    allBeatmaps = beatmaps.beatmaps
    roundNameEl.textContent = `// ${beatmaps.roundName} mappool`

    switch (beatmaps.roundName) {
        case "RO24": case "RO16":
            bestOf = 9
            break
        case "QF": case "SF":
            bestOf = 11
            break
        case "F": case "GF":
            bestOf = 13
            break
    }
    currentPickArray = new Array(bestOf)
    currentWinnerArray = new Array(bestOf)

    // Create ban images
    for (let i = 0; i < banCount; i++) {
        teamRedBanContainerEl.append(createBanImage())
        teamBlueBanContainerEl.append(createBanImage())
    }

    // Set default star count
    setDefaultStarCount(bestOf, redTeamStarContainerEl, blueTeamStarContainerEl)

    // Create pick tiles
    for (let i = 0; i < bestOf; i++) {
        const pickTile = document.createElement("div")
        pickTile.classList.add("pick-tile")

        // Pick tile category
        const pickTileCategory = document.createElement("img")
        pickTileCategory.classList.add("pick-tile-category", "absolute-center-x")

        // Pick Tile Border
        const pickTileBorder = document.createElement("img")
        pickTileBorder.classList.add("pick-tile-border")
        pickTileBorder.setAttribute("src", "../_shared/assets/pick-container/panel-border.png")

        // Pick Tile Winner Crown
        const pickTileWinnerCrown = document.createElement("img")
        pickTileWinnerCrown.classList.add("pick-tile-winner-crown", "absolute-center-x")

        // Pick Tile Bottom BG
        const pickTileBottomBg = document.createElement("img")
        pickTileBottomBg.classList.add("pick-tile-bottom-bg")

        // Pick Tile Bottom Text
        const pickTileBottomText = document.createElement("div")
        pickTileBottomText.classList.add("pick-tile-bottom-text")

        pickTile.append(pickTileCategory, pickTileBorder, pickTileWinnerCrown, pickTileBottomBg, pickTileBottomText)
        pickContainerEl.append(pickTile)
    }

    // Create map pick buttons
    for (let i = 0; i < allBeatmaps.length; i++) {
        const button = document.createElement("button")
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", function(event) {event.preventDefault()})
        button.classList.add("sidebar-button")
        button.dataset.id = allBeatmaps[i].beatmap_id
        button.textContent = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        mappoolManagementMapsEl.append(button)
    }

    // Load matches into match selection
    for (let i = 0; i < matches.length; i++) {
        const option = document.createElement("option")
        option.setAttribute("value", matches[i].id)
        option.textContent = `${matches[i].id}. ${shortenString(matches[i].team_a)} vs ${shortenString(matches[i].team_b)}`
        matchSelectEl.append(option)
    }
    matchSelectEl.setAttribute("size", matchSelectEl.childElementCount)

    allTeams = teams
})

// Create Ban Image
function createBanImage() {
    const image = document.createElement("img")
    return image
}

// Shorten string
const shortenString = str => str.length > 10 ? str.slice(0, 8) + "..." : str

// Ban Containers
const teamRedBanContainerEl = document.getElementById("team-red-ban-container")
const teamBlueBanContainerEl = document.getElementById("team-blue-ban-container")

// Current pick tile
let currentPickTile

// Current map
const currentMapBackgroundImageEl = document.getElementById("current-map-background-image")
const currentMapCategoryImageEl = document.getElementById("current-map-category-image")
const currentMapArtistTitleEl= document.getElementById("current-map-artist-title")
const currentMapArtistEl = document.getElementById("current-map-artist")
const currentMapTitleEl = document.getElementById("current-map-title")
const currentMapMappedByEl= document.getElementById("current-map-mapped-by")
const currentMapMapperNameEl = document.getElementById("current-map-mapper-name")
const currentMapPickerEl = document.getElementById("current-map-picker")
const currentMapWinResultEl = document.getElementById("current-map-win-result")
const currentMapWinScoresEl = document.getElementById("current-map-win-scores")

// Not Yet Picked Video
const notYetPickedVideoRedEl = document.getElementById("not-yet-picked-video-red")
const notYetPickedVideoBlueEl = document.getElementById("not-yet-picked-video-blue")
let currentNotYetPicked, notYetPicked = true

// Pick Videos
const pickVideoRedEl = document.getElementById("pick-video-red")
const pickVideoBlueEl = document.getElementById("pick-video-blue")

// Map Click Event
function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    const currentMap = findBeatmap(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    // Check if map exists in bans
    const mapCheck = !!(
        teamRedBanContainerEl.querySelector(`[data-id="${currentMapId}"]`) ||
        teamBlueBanContainerEl.querySelector(`[data-id="${currentMapId}"]`) ||
        pickContainerEl.querySelector(`[data-id="${currentMapId}"]`)
    )
    if (mapCheck) return

    // If ban
    if (action === "ban") {
        const currentElement = team === "red" ? teamRedBanContainerEl : teamBlueBanContainerEl

        for (let i = 1; i < currentElement.childElementCount; i++) {
            const imageElement = currentElement.children[i]
            if (imageElement.hasAttribute("data-id")) continue
            setBanDetails(imageElement, currentMap)
            break
        }
    }

    // If pick
    if (action === "pick") {
        let mapsFound = 0
        // Set Tile
        for (let i = 0; i < bestOf; i++) {
            let currentTile = pickContainerEl.children[i]
            if (pickContainerEl.children[i].hasAttribute("data-id")) continue
            currentTile.style.display = "block"
            currentTile.dataset.id = currentMap.beatmap_id
            currentTile.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
            currentTile.children[0].setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            currentTile.children[3].setAttribute("src", `static/pick-bgs/${currentMap.mod === "TB" ? "tb" : team}-pick-bg.png`)
            currentTile.children[4].textContent = `${currentMap.mod === "TB" ? "TB" : team.toUpperCase()} PICK`
            currentPickTile = currentTile
            mapsFound = 1
            notYetPicked = false


            if (team === "red" && currentMap.mod !== "TB") {
                pickVideoRedEl.style.opacity = 1
                pickVideoBlueEl.style.opacity = 0
            } else if (team === "blue" && currentMap.mod !== "TB") {
                pickVideoRedEl.style.opacity = 0
                pickVideoBlueEl.style.opacity = 1
            } else {
                pickVideoRedEl.style.opacity = 0
                pickVideoBlueEl.style.opacity = 0
            }
            break
        }

        // Set top information
        if (mapsFound !== 0) {
            // Set content
            currentMapBackgroundImageEl.setAttribute("src", `https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg`)
            currentMapCategoryImageEl.setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            currentMapArtistEl.textContent = currentMap.artist
            currentMapTitleEl.textContent = currentMap.title
            currentMapMapperNameEl.textContent = currentMap.creator
            currentMapPickerEl.setAttribute("src", `static/picks/${currentMap.mod === "TB" ? "tb" : team}-pick.png`)
            currentMapPickerEl.style.top = "535px"
            currentMapPickerEl.style.height = "65px"

            // Set display
            currentMapArtistTitleEl.style.display = "block"
            currentMapMappedByEl.style.display = "block"
            currentMapWinResultEl.style.display = "none"
            currentMapWinScoresEl.style.display = "none"
        }
    }
}

// Set Ban Details
function setBanDetails(element, currentMap) {
    element.parentElement.style.display = "flex"
    element.setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
    element.dataset.id = currentMap.beatmap_id
}

// Team Names
const teamRedNameEl = document.getElementById("team-red-name")
const teamBlueNameEl = document.getElementById("team-blue-name")
let currentTeamRedName, currentTeamBlueName, currentTeamRed, currentTeamBlue

// Winner Checking Variables
let noOfClients, currentRedScore, currentBlueScore, checkedWinner = false
let currentState

// Mappool Variables
let mapId, mapChecksum

// Chat variables
const chatDisplayWrapperEl = document.getElementById("chat-display-wrapper")
let chatLen = 0

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    // Current not yet picked
    if (currentNotYetPicked !== currentPicker) {
        currentNotYetPicked = currentPicker
    }
    if (currentNotYetPicked && isStarOn() && notYetPicked) {
        if (currentNotYetPicked === "red") {
            notYetPickedVideoRedEl.style.opacity = 1
            notYetPickedVideoBlueEl.style.opacity = 0
        } else if (currentNotYetPicked === "blue") {
            notYetPickedVideoRedEl.style.opacity = 0
            notYetPickedVideoBlueEl.style.opacity = 1
        } else if (currentNotYetPicked === "none") {
            notYetPickedVideoRedEl.style.opacity = 0
            notYetPickedVideoBlueEl.style.opacity = 0
        }
    } else {
        notYetPickedVideoRedEl.style.opacity = 0
        notYetPickedVideoBlueEl.style.opacity = 0
    }

    if (noOfClients !== data.tourney.clients.length) {
        noOfClients = data.tourney.clients.length
    }

    if (noOfClients > 0) {
        // Gameplay
        if (data.beatmap.time.live < data.beatmap.time.lastObject) {
            currentRedScore = 0
            currentBlueScore = 0
            for (let i = 0; i < noOfClients; i++) {
                const score = data.tourney.clients[i].play.score
                if (data.tourney.clients[i].team === "left") currentRedScore += score
                else currentBlueScore += score
            }
            checkedWinner = false
            currentState = 3

        } else {
            // Results
            if (!checkedWinner && currentPickTile && isStarOn()) {
                
                checkedWinner = true

                const winner = currentRedScore > currentBlueScore ? "red" : currentBlueScore > currentRedScore ? "blue" : undefined
                if (winner) {
                    // Set pick
                    currentPickTile.children[2].setAttribute("src", `../_shared/assets/winner-crowns/winner-${winner}-map.png`)
                    currentPickTile.children[2].style.display = "block"
                    // Add stars
                    updateStarCount(winner, "plus", redTeamStarContainerEl, blueTeamStarContainerEl, currentTeamRedName, currentTeamBlueName)
                }

                notYetPicked = false
            }
            currentState = 4 
        }
    } else {
        // If in main lobby scene
        currentRedScore = 0
        currentBlueScore = 0
        checkedWinner = false
        currentState = 1
    }

    // Set beatmap information
    if ((mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        // Find element
        const element = mappoolManagementMapsEl.querySelector(`[data-id="${mapId}"]`)

        // Click Event
        if (isAutopickOn && (!element.hasAttribute("data-is-autopicked") || element.getAttribute("data-is-autopicked") !== "true")) {
            // Check if autopicked already
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (currentPicker === "red")? 0 : 2
            })
            element.dispatchEvent(event)
            element.setAttribute("data-is-autopicked", "true")

            if (currentPicker === "red") setAutopicker("blue")
            else if (currentPicker === "blue") setAutopicker("red")
        } else {
            setAutopicker("none")
        }
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        chatLen = updateChat(data.tourney, chatLen, chatDisplayWrapperEl, true, getLogsApi(), currentTeamRed, currentTeamBlue, currentTeamRedName, currentTeamBlueName)
    }

    // Save pick string
    currentPickArray = new Array(bestOf)
    for (let i = 0; i < pickContainerEl.childElementCount; i++) {
        if (pickContainerEl.children[i].hasAttribute("data-id")) currentPickArray[i] = pickContainerEl.children[i].dataset.id
    }
    if (currentPickArray !== previousPickArray) {
        previousPickArray = currentPickArray
        localStorage.setItem("currentPickString", currentPickArray.join("|"))
    }

    // Save winner string
    currentWinnerArray = new Array(bestOf)
    for (let i = 0; i < pickContainerEl.childElementCount; i++) {
        if (pickContainerEl.children[i].hasAttribute("data-id") &&
            pickContainerEl.children[i].children[2].hasAttribute("src")
        ) {
            if (pickContainerEl.children[i].children[2].getAttribute("src").includes("winner-red-map")) currentWinnerArray[i] = "red"
            else if (pickContainerEl.children[i].children[2].getAttribute("src").includes("winner-blue-map")) currentWinnerArray[i] = "blue"
        }
    }
    if (currentWinnerArray !== previousWinnerArray) {
        previousWinnerArray = currentWinnerArray
        localStorage.setItem("currentWinnerString", currentWinnerArray.join("|"))
    }

    // Log Data
    const logData = {
        tournament: "ANZT13S",
        team: {
            left: currentTeamRedName,
            right: currentTeamBlueName
        },
        isStarOn: isStarOn(),
        ipcState: currentState,
        checkedWinner: checkedWinner,
        playerInfo: {},
        scoreInfo: {
            team: {
                left: 0,
                right: 0
            },
            individual: {}
        },
        beatmapInfo: {
            currentBeatmapId: mapId,
            currentBeatmapDetails: findBeatmap(mapId)
        }
    }

    // If not in lobby
    if (currentState !== 1) {
        const clients = data.tourney.clients
        // Populate player info
        for (let i = 0; i < noOfClients; i++) {
            logData.playerInfo[`player${i + 1}Id`] = clients[i].user.id
            logData.playerInfo[`player${i + 1}Name`] = clients[i].user.name
        }

        // Populate score info
        let scoresLeft = 0, scoresRight = 0
        for (let i = 0; i < noOfClients; i++) {
            const currentScore = clients[i].play.score
            logData.scoreInfo.individual[`player${i + 1}`] = currentScore
            if (clients[i].team === "left") scoresLeft += currentScore
            else scoresRight += currentScore
        }

        logData.scoreInfo.team.left = scoresLeft
        logData.scoreInfo.team.right = scoresRight
    }

    sendLog(logData, "log", getLogsApi())
}

// Update Star Count Buttons
const setStarRedPlusEl = document.getElementById("set-star-red-plus")
const setStarRedMinusEl = document.getElementById("set-star-red-minus")
const setStarBluePlusEl = document.getElementById("set-star-blue-plus")
const setStarBlueMinusEl = document.getElementById("set-star-blue-minus")

// Next autopick
const nextAutopickNextEl = document.getElementById("next-autopick-text")
const nextAutopickRedEl = document.getElementById("next-autopick-red")
const nextAutopickBlueEl = document.getElementById("next-autopick-blue")
const toggleAutopickButtonEl = document.getElementById("toggle-autopick-button")
const toggleAutopickOnOffEl = document.getElementById("toggle-autopick-on-off")
let isAutopickOn = false, currentPicker = "red"

// Apply Match button
const applyMatchButtonEl = document.getElementById("apply-match")

// Toggle stars button
const toggleStarButtonEl = document.getElementById("toggle-stars-button")
const toggleStarsOnOffEl = document.getElementById("toggle-stars-on-off")
document.addEventListener("DOMContentLoaded", () => {
    toggleStarButtonEl.addEventListener("click", () => toggleStars(toggleStarsOnOffEl, toggleStarButtonEl, redTeamStarContainerEl, blueTeamStarContainerEl))
    document.cookie = `toggleStarContainers=${true}; path=/`

    // Update star count buttons
    setStarRedPlusEl.addEventListener("click", () => updateStarCount("red", "plus", redTeamStarContainerEl, blueTeamStarContainerEl, currentTeamRedName, currentTeamBlueName))
    setStarRedMinusEl.addEventListener("click", () => updateStarCount("red", "minus", redTeamStarContainerEl, blueTeamStarContainerEl, currentTeamRedName, currentTeamBlueName))
    setStarBluePlusEl.addEventListener("click", () => updateStarCount("blue", "plus", redTeamStarContainerEl, blueTeamStarContainerEl, currentTeamRedName, currentTeamBlueName))
    setStarBlueMinusEl.addEventListener("click", () => updateStarCount("blue", "minus", redTeamStarContainerEl, blueTeamStarContainerEl, currentTeamRedName, currentTeamBlueName))

    // Toggle Autopick button
    toggleAutopickButtonEl.addEventListener("click", function() {
        isAutopickOn = !isAutopickOn
        toggleAutopickOnOffEl.textContent = isAutopickOn ? "ON" : "OFF"
        toggleAutopickButtonEl.classList.toggle("toggle-on", isAutopickOn)
        toggleAutopickButtonEl.classList.toggle("toggle-off", !isAutopickOn)
    })

    // Set Autopicker Buttons
    nextAutopickRedEl.addEventListener("click", () => setAutopicker("red"))
    nextAutopickBlueEl.addEventListener("click",() => setAutopicker("blue"))

    // Current Picker
    currentPickerRedEl.addEventListener("click", () => updateCurrentPicker("red"))
    currentPickerBlueEl.addEventListener("click", () => updateCurrentPicker("blue"))
    currentPickerNoneEl.addEventListener("click", () => updateCurrentPicker("none"))
    currentPickerNoneEl.click()

    // Apply match button
    applyMatchButtonEl.addEventListener("click", () => applyMatch())

    // Ban Pick Management
    banPickManagementSelectActionEl.addEventListener("click", setBanPickAction)
})

// Setting current picker
const currentPickerTextEl = document.getElementById("current-picker-text")
const currentPickerRedEl = document.getElementById("current-picker-red")
const currentPickerBlueEl = document.getElementById("current-picker-blue")
const currentPickerNoneEl = document.getElementById("current-picker-none")
function updateCurrentPicker(side) {
    currentPickerTextEl.textContent = side
    document.cookie = `currentPicker=${side}; path=/`
}

// Set Autopicker
function setAutopicker(picker) {
    currentPicker = picker
    nextAutopickNextEl.textContent = `${currentPicker.substring(0, 1).toUpperCase()}${currentPicker.substring(1)}`
}

// Apply Match
async function applyMatch() {
    const match = await findMatch(matchSelectEl.value)
    if (!match) return

    // Team A
    currentTeamRedName = match.team_a
    currentTeamRed = await findTeam(currentTeamRedName)
    teamRedNameEl.textContent = currentTeamRedName

    // Team B
    currentTeamBlueName = match.team_b
    currentTeamBlue = await findTeam(currentTeamBlueName)
    teamBlueNameEl.textContent = currentTeamBlueName

    document.cookie = `currentTeamRedName=${currentTeamRedName}; path=/`
    document.cookie = `currentTeamBlueName=${currentTeamBlueName}; path=/`
}

// Set Ban Pick Action
const banPickManagementEl = document.getElementById("ban-pick-management")
const banPickManagementSelectActionEl = document.getElementById("ban-pick-management-select-action")
let currentAction
function setBanPickAction() {
    currentAction = banPickManagementSelectActionEl.value
    currentBanContainer = undefined
    currentPickTeam = undefined
    currentBanTeam = undefined
    sidebarButtonBeatmap = undefined

    while (banPickManagementEl.childElementCount > 3) {
        banPickManagementEl.lastElementChild.remove()
    }

    // Bans
    if (currentAction === "setBan" || currentAction === "removeBan") {
        makeSidebarText("Which Team?")

        // Which Team Select
        const whichTeamSelect = document.createElement("select")
        whichTeamSelect.setAttribute("id", "which-ban-select")
        whichTeamSelect.classList.add("ban-pick-management-select")
        whichTeamSelect.addEventListener("change", event => setBanContainer(event.currentTarget))

        // Which Team Select Options
        let noOfBans = 0
        while (noOfBans < banCount) {
            whichTeamSelect.append(
                makeTeamBanOption("red", noOfBans + 1),
                makeTeamBanOption("blue", noOfBans + 1)
            )
            noOfBans++
        }
        whichTeamSelect.setAttribute("size", whichTeamSelect.childElementCount)
        banPickManagementEl.append(whichTeamSelect)

        if (whichTeamSelect.options.length > 0) {
            whichTeamSelect.selectedIndex = 0
            whichTeamSelect.dispatchEvent(new Event("change"))
        }

        if (currentAction === "setBan") makeTeamAddMaps()
    }

    // Picks / Winner
    if (currentAction === "setPick" || currentAction === "removePick" || currentAction === "setWinner" || currentAction === "removeWinner") {
        makeSidebarText("Which Pick?")

        // Which pick?
        const whichPickSelect = document.createElement("div")
        whichPickSelect.classList.add("which-map-select")

        // Which Map Select
        makeTeamPickButton(whichPickSelect)
        banPickManagementEl.append(whichPickSelect)

        // Set Pick
        if (currentAction === "setPick") {
            makeTeamAddMaps()
            whichTeamSelect("Which Team Pick?")
        }

        // Set Winner
        if (currentAction === "setWinner") whichTeamSelect("Which Team Won?")
    }

    // Apply changes button
    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("sidebar-button", "full-size-button", "apply-changes-button")
    applyChangesButton.textContent = "Apply Changes"

    // Apply changes clicks
    switch (currentAction) {
        case "setBan": applyChangesButton.addEventListener("click", sidebarSetBanAction); break;
        case "removeBan": applyChangesButton.addEventListener("click", sidebarRemoveBanAction); break;
        case "setPick": applyChangesButton.addEventListener("click", sidebarSetPickAction); break;
        case "removePick": applyChangesButton.addEventListener("click", sidebarRemovePickAction); break;
        case "setWinner": applyChangesButton.addEventListener("click", sidebarSetWinnerAction); break;
        case "removeWinner": applyChangesButton.addEventListener("click", sidebarRemoveWinnerAction); break;
    }
    banPickManagementEl.append(applyChangesButton)

}

// Make sidebar text
function makeSidebarText(text) {
    const h2 = document.createElement("h2")
    h2.textContent = text
    banPickManagementEl.append(h2)
}

// Team Ban Options
function makeTeamBanOption(team, number) {
    const selectOptionBan = document.createElement("option")
    selectOptionBan.setAttribute("value", `${team}|${number}|ban`)
    selectOptionBan.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)} Ban ${number}`
    return selectOptionBan
}

// Team Select Options
function makeTeamSelectOption(team) {
    const selectOptionTeam = document.createElement("option")
    selectOptionTeam.setAttribute("value", team)
    selectOptionTeam.innerText = `${team.substring(0, 1).toUpperCase()}${team.substring(1)}`
    return selectOptionTeam
}

// Team Pick Button
function makeTeamPickButton(whichPickSelect) {
    for (let i = 0; i < bestOf; i++) {
        // Which Map Button
        whichTeamButtonCreate(i, whichPickSelect)
    }
}

// Which Pick Button Create
function whichTeamButtonCreate(i, whichPickSelect) {
    const whichPickButton = document.createElement("button")
    whichPickButton.classList.add("which-side-button", "which-pick-button")
    whichPickButton.innerText = `Pick ${i + 1}`
    whichPickButton.addEventListener("click", event => setSidebarPick(event.currentTarget))
    whichPickButton.dataset.pickNumber = i + 1
    whichPickSelect.append(whichPickButton)
}

// Selected Option BG Colour
const selectedBGColour = "#CECECE"

// Set sidebar pick
const whichPickButtons = document.getElementsByClassName("which-pick-button")
let sidebarButtonPickNumber
function setSidebarPick(element) {
    sidebarButtonPickNumber = element.dataset.pickNumber

    for (let i = 0; i < whichPickButtons.length; i++) {
        whichPickButtons[i].style.backgroundColor = "transparent"
        whichPickButtons[i].style.color = "unset"
    }

    element.style.backgroundColor = selectedBGColour
    element.style.color = "black"
    setPickContainer(element)
}

// Which Team Select
function whichTeamSelect(text) {
    // Which team?
    makeSidebarText(text)

    // Which Team Select
    const whichTeamSelect = document.createElement("select")
    whichTeamSelect.setAttribute("id", "which-team-select")
    whichTeamSelect.classList.add("ban-pick-management-select")
    whichTeamSelect.setAttribute("size", 2)

    // Which Team Select Options
    whichTeamSelect.append(makeTeamSelectOption("red"), makeTeamSelectOption("blue"))
    banPickManagementEl.append(whichTeamSelect)
}


// Add Ban Container
let currentBanContainer, currentBanTeam
function setBanContainer(element) {
    const currentBanElements = element.value.split("|")
    currentBanTeam = currentBanElements[0]
    if (currentBanTeam === "red") currentBanContainer = teamRedBanContainerEl.querySelectorAll("img")[currentBanElements[1] - 1]
    else currentBanContainer = teamBlueBanContainerEl.querySelectorAll("img")[currentBanElements[1] - 1]
}

// Set Piock Container
let currentPickContainer, currentPickTeam
function setPickContainer(element) {
    const currentPickElement = element
    currentPickTeam = currentPickElement.dataset.side
    if (currentPickTeam === "red") currentPickContainer = pickContainer.querySelectorAll(".red-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    else if (currentPickTeam === "blue") currentPickContainer = blueChoiceContainerEl.querySelectorAll(".blue-pick-container")[Number(currentPickElement.dataset.pickNumber) - 1]
    else if (currentPickTeam === "TB") currentPickContainer = tiebreakerPickContainerEl
}

// Team Add maps
function makeTeamAddMaps() {
    // Which map?
    makeSidebarText("Which Map?")

    // Which Map Select
    const whichMapSelect = document.createElement("div")
    whichMapSelect.classList.add("which-map-select")
    for (let i = 0; i < allBeatmaps.length; i++) {
        // Which Map Button
        const currentMap = allBeatmaps[i]
        const whichMapButton = document.createElement("button")
        whichMapButton.classList.add("which-side-button", "which-map-button")
        whichMapButton.innerText = `${currentMap.mod}${currentMap.order}`
        whichMapButton.addEventListener("click", event => setSidebarBeatmap(event.currentTarget))
        whichMapButton.dataset.id = currentMap.beatmap_id
        whichMapSelect.append(whichMapButton)
    }
    banPickManagementEl.append(whichMapSelect)
}

// Set sidebar beatmap
const whichMapButtons = document.getElementsByClassName("which-map-button")
let sidebarButtonBeatmap
function setSidebarBeatmap(element) {
    sidebarButtonBeatmap = element.dataset.id
    for (let i = 0; i < whichMapButtons.length; i++) {
        whichMapButtons[i].style.backgroundColor = "transparent"
        whichMapButtons[i].style.color = "unset"
    }
    element.style.backgroundColor = selectedBGColour
    element.style.color = "black"
}

// Sidebar Set Ban Action
function sidebarSetBanAction() {
    if (!currentBanContainer || !sidebarButtonBeatmap) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    setBanDetails(currentBanContainer, currentMap)
}

// Sidebar Remove Ban Action
function sidebarRemoveBanAction() { 
    if (!currentBanContainer) return

    // Remove details
    currentBanContainer.removeAttribute("src")
    currentBanContainer.removeAttribute("data-id")

    // Potentially remove display
    const banContainerParent = currentBanContainer.parentElement
    const allBanImages = banContainerParent.getElementsByTagName("img")
    let banCount = 0
    for (let i = 0; i < allBanImages.length; i++) {
        if (allBanImages[i].hasAttribute("src")) banCount++
    }
    if (banCount === 0) banContainerParent.style.display = "none"
}

function sidebarSetPickAction() {
    if (!sidebarButtonPickNumber || !sidebarButtonBeatmap || !document.getElementById("which-team-select").value) return
    const currentMap = findBeatmap(sidebarButtonBeatmap)
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    const team = document.getElementById("which-team-select").value
    currentTile.style.display = "block"
    currentTile.dataset.id = currentMap.beatmap_id
    currentTile.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
    currentTile.children[0].setAttribute("src", `../_shared/assets/category-images/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
    currentTile.children[3].setAttribute("src", `static/pick-bgs/${currentMap.mod === "tb" ? "TB" : team}-pick-bg.png`)
    currentTile.children[4].textContent = `${currentMap.mod === "TB" ? "TB" : team.toUpperCase()} PICK`
}

// Sidebar Remove Ban / Pick Action functions
function sidebarRemovePickAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    currentTile.style.display = "none"
    currentTile.removeAttribute("data-id")
    currentTile.style.backgroundImage = `unset`
    currentTile.children[0].removeAttribute("src")
    currentTile.children[3].removeAttribute("src")
    currentTile.children[4].textContent = ""
}

// Sidebar Set Winner Action
function sidebarSetWinnerAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    const team = document.getElementById("which-team-select").value

    currentTile.children[2].style.display = "block"
    currentTile.children[2].setAttribute("src", `../_shared/assets/winner-crowns/winner-${team}-map.png`)
}

// Sidebar Remove Winner Action
function sidebarRemoveWinnerAction() {
    if (!sidebarButtonPickNumber) return
    const currentTile = pickContainerEl.children[sidebarButtonPickNumber - 1]
    currentTile.children[2].style.display = "none"
    currentTile.children[2].removeAttribute("src")
}