/* PERIODIC REFRESH */
const PERIODIC_REFRESH_MS = 10_000;
let periodicRefresh = undefined;
let lastETag = undefined;

function startPeriodicRefresh() {
    stopPeriodicRefresh();

    periodicRefresh = setInterval(updateRefresh, PERIODIC_REFRESH_MS);
}

function stopPeriodicRefresh() {
    // Clear existing refresh
    clearInterval(periodicRefresh);

    periodicRefresh = undefined;
}

async function updateRefresh(forced = false) {
    // Get ETag
    let etag = await Posts_API.HEAD();

    // If errored, skip
    if (etag === null)
        return false;

    // If not forced and the items didn't change, skip
    if (!forced && etag === lastETag)
        return false;

    // Update ETag
    lastETag = etag;

    await pageManager.update(false);
    await compileCategories();

    return true;
}