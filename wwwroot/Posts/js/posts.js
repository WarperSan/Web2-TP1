/* POSTS */
const SCROLL_PANEL_ID = "#scrollPanel";
const ITEMS_PANEL_ID = "#itemsPanel";
const CREATE_BUTTON_ID = "#createPost";
const EDIT_BUTTON_ID = ".editPost";
const DELETE_BUTTON_ID = "#deletePost";
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
                    <i class="cmdIcon fa-solid fa-pen editPost" title="Modifier cette nouvelle"></i>
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

    element.find(EDIT_BUTTON_ID).on("click", async function () {
        let response = await Posts_API.Get("Id=" + post.Id);
        renderPostForm(response.data[0]);
    });

    element.find(DELETE_BUTTON_ID).on("click", function () {
        bootbox.confirm({
            message: `Voulez-vous supprimer cette nouvelle? <br> <b>${post.Title}</b>`,
            buttons: {
                confirm: {
                    label: 'Confirmer',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'Annuler',
                    className: 'btn-danger'
                }
            },
            callback: async function (result) {

                // If not confirmed, skip
                if (!result)
                    return;

                await Posts_API.Delete(post.Id);
                pageManager.update(false);
            }
        });
    });

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