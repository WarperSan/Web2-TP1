/* WAITING LOGO */
const WAITING_PARENT = "#posts-parent";
const WAITING_ID = "post-waiting-loader";
const WAITING_TIMEOUT_MS = 2000;
let waitingTimeout = undefined;

/** Adds the waiting logo */
function addWaitingLogo() {
    removeWaitingLogo();

    // Delay to append
    waitingTimeout = setTimeout(function () {
        $(WAITING_PARENT).append($(`
            <div id="${WAITING_ID}" class="loader" style="margin: auto;"></div>
        `));
    }, WAITING_TIMEOUT_MS);
}

/** Removes the waiting logo */
function removeWaitingLogo() {
    // Clear existing timeout
    clearTimeout(waitingTimeout);
    waitingTimeout = undefined;

    // Remove loader
    $("#" + WAITING_ID).remove();
}

