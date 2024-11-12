/* TITLE */
const TITLE_ID = "#actionTitle";

function setTitle(title) {
    $(TITLE_ID).text(title);
}

/* POST FORM */
const FORM_PARENT_ID = "#formParent";
const POST_FORM_ID = "#postForm";
const POST_FORM_CANCEL_ID = "#postCancelForm";

/** Fetches the data of the given form */
function getFormData(form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    let jsonObject = {};
    $.each(form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderPostForm(post = undefined) {
    hidePosts();

    let isCreating = post === undefined;

    if (isCreating)
        post = createPost();

    let parent = $(FORM_PARENT_ID);
    parent.empty();

    parent.append(`
        <form class="form" id="${POST_FORM_ID.substring(1)}">
            <!-- POST ID -->
            <input type="hidden" name="Id" value="${post.Id}" />
            
            <!-- POST CREATION -->
            <input type="hidden" name="Creation" value="${Date.now()}" />

            <!-- POST TITLE -->
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                value="${post.Title || ""}"
            />
            
            <!-- POST CATEGORY -->
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category || ""}"
            />
            
            <!-- POST IMAGE -->
            <label for="Image" class="form-label">Image </label>
            <div
                class='imageUploader' 
                newImage='${isCreating}' 
                controlId='Image' 
                imageSrc='${post.Image || "Posts2/images/no-image.png"}' 
                waitingImage="Posts2/Loading_icon.gif">
            </div>
            
            <!-- POST TEXT -->
            <label for="Text" class="form-label">Texte </label>
            <textarea
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Texte"
                required>${post.Text || ""}</textarea>
            
            <br>
            <!-- BUTTONS -->
            <input type="submit" value="Enregistrer" class="btn btn-primary">
            <input type="button" value="Annuler" id="${POST_FORM_CANCEL_ID.substring(1)}" class="btn btn-secondary">
        </form>
    `);
    parent.show();

    initImageUploaders();
    initFormValidation();

    $(POST_FORM_ID).on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($(this));
        post.Image = "player3.png";

        let result = await Posts_API.Save(post, isCreating);

        if (result.isError) {
            renderError("Une erreur est survenue!");
            return;
        }

        showPosts();

        console.log(result);

        await pageManager.update(false);
        pageManager.scrollToElem(result.Id);

        await compileCategories();
    });

    $(POST_FORM_CANCEL_ID).on("click", showPosts);
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
    $(ABORT_BUTTON_ID).hide();

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
                <div style="flex: 1;"><!-- BUTTONS --></div>
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

/* CATEGORIES */
const CATEGORY_PARENT = ".post-categories-dropdown .content";
const CATEGORY_ADDED_DEFAULT = false;
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

/* ERROR FORM */
const ERROR_CONTAINER_ID = "#errorContainer";

/** Renders the given error */
function renderError(message) {
    hidePosts();
    $(FORM_PARENT_ID).empty();
    setTitle("Erreur du serveur...");

    let content = $(`<div>${message}</div>`);

    let container = $(ERROR_CONTAINER_ID);
    container.append(content);
    container.show();
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
$(CREATE_BUTTON_ID).on("click", renderPostForm);
$(ABORT_BUTTON_ID).on("click", showPosts);
$(KEYWORD_ID).on('keydown', onSearchEnter);

compileCategories();

showPosts();
startPeriodicRefresh();
