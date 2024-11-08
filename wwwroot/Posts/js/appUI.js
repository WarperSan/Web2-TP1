/* POSTS */
const POST_PARENT = "#posts-parent";
const POST_CLASS = ".post";
const POST_TEXT = ".post-text";
const POST_READ_MORE = ".read-more-container button";
let loadedPosts = undefined;
let hasLoaded = false;

async function fetchPosts(queryString) {
    // Build Query
    let query = [
        "sort=creation,desc",
        queryString.substring(1)
    ];

    if (selectedCategories !== undefined)
        query.push("category=(" + selectedCategories.join("|") + ")");

    if (keywords !== undefined)
        query.push("keywords=" + keywords);

    let qString = query.length === 0 ? undefined : query.join("&");

    // Fetch items
    addWaitingLogo();
    let response = await Posts_API.Get(qString);
    removeWaitingLogo();

    // If errored, reset loaded
    if (response === null)
    {
        loadedPosts = undefined;
        currentETag = undefined;
    }
    else
    {
        loadedPosts = response.data;
        currentETag = response.ETag;
    }

    if (!loadedPosts || loadedPosts.length === 0)
        return true;

    $(POST_PARENT).empty();

    for (const post of loadedPosts) {
        // If category not added yet, add
        if (checkedCategories[post.Category] === undefined)
            checkedCategories[post.Category] = !hasLoaded || CATEGORY_ADDED_DEFAULT;

        renderPost(post);
    }

    // Hide loader
    $(".loader-container").hide();
    hasLoaded = true;
}

/** Renders the given post */
function renderPost(post) {
    let element = $(`
        <div class="post" data-id="${post.Id}">
            <!-- HEADER -->
            <div class="post-header">
                <span class="post-category">${post.Category.toUpperCase()}</span>
                <div style="flex: 1;"><!-- BUTTONS --></div>
            </div>
            <span class="post-title">${post.Title}</span>
            <img class="post-image" style="background-image: url('${post.Image}');" alt=""/>
            <span class="post-date">${convertToFrenchDate(post.Creation)}</span>
            <span class="${POST_TEXT.substring(1)}">TEXTE: ${post.Text}</span>
            <div class="read-more-container">
                <button type="button" class="btn btn-light">Lire la suite</button>
            </div>
        </div>
    `);

    $(POST_PARENT).append(element);

    // Check if the text is overflowing
    let postText = element.find(POST_TEXT);
    let readMoreButton = element.find(POST_READ_MORE);

    // If overflowing, add click
    if (postText[0].scrollHeight > postText.innerHeight()) {
        readMoreButton.click(function () {
            let postText = $(this).closest(POST_CLASS).find(POST_TEXT);

            // Toggle the "expanded" class
            postText.toggleClass('expanded');

            // Change button text based on current state
            if (postText.hasClass('expanded')) {
                $(this).text('Lire moins');  // Show less
            } else {
                $(this).text('Lire la suite');  // Show more
            }
        });
    } else
        readMoreButton.hide();
}

/** Par Nicolas Chourot */
function convertToFrenchDate(numeric_date) {
    let date = new Date(numeric_date);
    let options = {year: 'numeric', month: 'long', day: 'numeric'};
    let opt_weekday = {weekday: 'long'};
    let weekday = date.toLocaleDateString("fr-FR", opt_weekday).replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        }
    );

    return weekday + ", " + date.toLocaleDateString("fr-FR", options) + " - " + date.toLocaleTimeString("fr-FR");
}

/* CATEGORIES */
const CATEGORY_PARENT = ".post-categories-dropdown .content";
let loadedCategories = undefined;
let selectedCategories = undefined;
let checkedCategories = {};

/** Renders all the categories */
async function compileCategories() {
    // Fetch categories
    let categories = await Posts_API.Get("fields=category&sort=category");

    // If errored, clear all
    if (categories === null) {
        loadedCategories = undefined;
        selectedCategories = undefined;
        return undefined;
    }

    // Compile categories
    loadedCategories = [...new Set(categories.data.map(i => i.Category))];

    // Remove invalid categories
    if (selectedCategories)
        selectedCategories = selectedCategories.filter(c => loadedCategories.indexOf(c) !== -1);
    else
        selectedCategories = undefined;

    $(CATEGORY_PARENT).empty();

    for (const category of loadedCategories)
        renderCategory(category);
}

/** Renders the given category */
function renderCategory(category) {
    let checked = checkedCategories[category] !== false;

    let element = $(`
        <li>
            <label>
                <input type="checkbox" value="${category}" ${checked ? "checked" : ""} /> ${category}
            </label>
        </li>
    `);

    element.change(function () {
        checkedCategories[$(this).val()] = $(this).is(":checked");

        let keys = Object.keys(checkedCategories).filter(key => checkedCategories[key]);

        $(".loader-container").show();
        manager.setCategories(keys);

        pageManager.reset();
    });

    $(CATEGORY_PARENT).append(element);
}

/* KEYWORDS */
const KEYWORD_ID = "#search-text";
let keywords = undefined;

$(KEYWORD_ID).on('keydown', function (e) {
    if (e.originalEvent.keyCode !== 13)
        return;

    let searchString = $(this).val().trim();
    if (searchString === '')
        keywords = undefined;
    else
        keywords = searchString;

    pageManager.update(true);
});

/* PAGE MANAGER */
let pageManager = undefined;

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

/* WAITING LOGO */
const WAITING_PARENT = "#posts-parent";
const WAITING_ID = "post-waiting-loader";
const WAITING_TIMEOUT_MS = 2000;
let waitingTimeout = undefined;

function addWaitingLogo() {
    removeWaitingLogo();

    // Delay to append
    waitingTimeout = setTimeout(function () {
        $(WAITING_PARENT).append($(`
            <div id="${WAITING_ID}" class="loader" style="margin: auto;"></div>
        `));
    }, WAITING_TIMEOUT_MS);
}

function removeWaitingLogo() {
    // Clear existing timeout
    clearTimeout(waitingTimeout);
    waitingTimeout = undefined;

    // Remove loader
    $("#" + WAITING_ID).remove();
}

/* START */
pageManager = new PageManager(POST_PARENT.substring(1), POST_PARENT.substring(1), {
    width: 200,//$("#sample").outerWidth(),
    height: 200,//$("#sample").outerHeight()
}, fetchPosts);
compileCategories();
startPeriodicRefresh();