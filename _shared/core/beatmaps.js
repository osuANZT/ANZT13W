let allShowcaseBeatmaps = []
let allBeatmaps = []

// Load showcase beatmaps
export async function loadShowcaseBeatmaps() {
    const response = await axios.get("../_data/showcase-beatmaps.json")
    allShowcaseBeatmaps = response.data
    return allShowcaseBeatmaps
}

// Find showcase beatmap from Id
export function findShowcaseBeatmap(beatmap_string) {
    return allShowcaseBeatmaps.beatmaps.find(b => b.beatmap_string === beatmap_string)
}

// Load showcase beatmaps
export async function loadBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}

// Find showcase beatmap from Id
export function findBeatmap(id) {
    return allBeatmaps.beatmaps.find(b => Number(b.beatmap_id) === Number(id))
}