/* TITLE */
const TITLE_ID = "#actionTitle";

function setTitle(title) {
    $(TITLE_ID).text(title);
}

/* POSTS */
const SCROLL_PANEL_ID = "#scrollPanel";
const ITEMS_PANEL_ID = "#itemsPanel";
const CREATE_BUTTON_ID = "#createPost";
const ABORT_BUTTON_ID = "#abort";

const POST_CLASS = ".post";
const POST_TEXT = ".post-text";
const POST_READ_MORE = ".read-more-container button";
let hasLoaded = false;

/** Creates an empty post object */
function createPost() {
    return {
        Id: "",
        Category: "",
        Creation: 0,
        Image: "",
        Text: "",
        Title: ""
    };
}

/** Shows all the posts */
function showPosts() {
    setTitle("Fil des nouvelles");

    $(SCROLL_PANEL_ID).show();
    $(CREATE_BUTTON_ID).show();

    $(ABORT_BUTTON_ID).hide();
    $(FORM_PARENT_ID).hide();

    startPeriodicRefresh();
}

/** Hides all the posts */
function hidePosts() {
    $(SCROLL_PANEL_ID).hide();
    $(CREATE_BUTTON_ID).hide();

    $(FORM_PARENT_ID).show();
    $(ABORT_BUTTON_ID).show();

    stopPeriodicRefresh();
}

/** Fetches and renders all the posts */
async function renderPosts(queryString) {
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
    if (response === null) {
        currentETag = undefined;
    } else {
        currentETag = response.ETag;
    }

    if (response === null || response.data.length === 0)
        return true;

    for (const post of response.data) {
        // If category not added yet, add
        if (checkedCategories[post.Category] === undefined)
            checkedCategories[post.Category] = !hasLoaded || CATEGORY_ADDED_DEFAULT;

        renderPost(post);
    }

    // Hide loader
    $(".loader-container").hide();
    hasLoaded = true;
    return false;
}

/** Renders the given post */
function renderPost(post) {
    let element = $(`
        <div class="post" id="${post.Id}">
            <!-- HEADER -->
            <div class="post-header">
                <span class="post-category">${post.Category.toUpperCase()}</span>
                <div style="flex: 1;">
                    <i class="cmdIcon fa-solid fa-pen" id="editPost" title="Modifier cette nouvelle"></i>
                    <i class="cmdIcon fa-solid fa-x" id="deletePost" title="Effacer cette nouvelle"></i>
                </div>
            </div>
            <span class="post-title">${post.Title}</span>
            <img class="post-image" style="background-image: url('${post.Image}');" alt=""/>
            <span class="post-date">${convertToFrenchDate(post.Creation)}</span>
            <span class="${POST_TEXT.substring(1)}">${post.Text}</span>
            <div class="read-more-container">
                <button type="button" class="btn btn-light">Lire la suite</button>
            </div>
        </div>
        <hr>
    `);

    $(ITEMS_PANEL_ID).append(element);

    // Check if the text is overflowing
    let postText = element.find(POST_TEXT);
    let readMoreButton = element.find(POST_READ_MORE);

    // If overflowing, add click
    if (postText[0].scrollHeight > postText.innerHeight()) {
        postText.addClass("full");
        readMoreButton.click(function () {
            let postText = $(this).closest(POST_CLASS).find(POST_TEXT);

            // Toggle the "expanded" class
            postText.toggleClass('expanded');
            postText.toggleClass('full');

            // Change button text based on current state
            if (postText.hasClass('expanded')) {
                $(this).text('Lire moins');  // Show less
            } else {
                $(this).text('Lire la suite');  // Show more
            }
        });
    } else
        readMoreButton.hide();

    return element;
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

/* KEYWORDS */
const KEYWORD_ID = "#search-text";
let keywords = undefined;

/** Sets the current search keywords */
function onSearchEnter(e) {
    if (e.originalEvent.keyCode !== 13)
        return;

    let searchString = $(this).val().trim();
    if (searchString === '')
        keywords = undefined;
    else
        keywords = searchString;

    pageManager.update(true);
}

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



/* START */
let sample = renderPost(createPost());
pageManager = new PageManager(
    SCROLL_PANEL_ID.substring(1),
    ITEMS_PANEL_ID.substring(1),
    {
        width: sample.outerWidth(),
        height: sample.outerHeight()
    },
    renderPosts
);
sample.remove();

// Set listeners
$(CREATE_BUTTON_ID).on("click", function () {
    renderPostForm();
});
$(ABORT_BUTTON_ID).on("click", showPosts);
$(KEYWORD_ID).on('keydown', onSearchEnter);

compileCategories();

showPosts();
startPeriodicRefresh();
