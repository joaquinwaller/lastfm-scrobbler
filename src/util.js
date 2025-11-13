function chunkArray(array, size = 49) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}


function fakeTimestamps(tracks) {
    const now = Math.floor(Date.now() / 1000);
    let offset = 0;

    return tracks.map(t => {
        const dur = (t.duration ?? 180000) / 1000;
        const min = Math.max(30, Math.min(dur / 2, 240));
        offset += min;
        return { ...t, timestamp: now - offset };
    });
}

module.exports = { chunkArray, delay, fakeTimestamps };
