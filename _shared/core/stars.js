export function displayStars(currentOsuBestOf, redTeamStarContainerEl, blueTeamStarContainerEl, currentRedTeamStars, currentBlueTeamStars) {
    const currentOsuFirstTo = Math.ceil(currentOsuBestOf / 2)

    redTeamStarContainerEl.innerHTML = ""
    blueTeamStarContainerEl.innerHTML = ""

    for (let i = 0; i < currentOsuFirstTo; i++) {
        redTeamStarContainerEl.append(createStarImage(currentRedTeamStars > i ? "fill" : "empty"))
        blueTeamStarContainerEl.append(createStarImage(currentBlueTeamStars > i ? "fill" : "empty"))
    }
}

function createStarImage(status) {
    const imageDiv = document.createElement("div")
    imageDiv.classList.add("team-star-container")

    const image = document.createElement("img")
    image.setAttribute("src", `../_shared/assets/points/point-${status}.png`)

    imageDiv.append(image)
    return imageDiv
}