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





/* PAGE MANAGER */
let pageManager = undefined;

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
