/* TITLE */
const TITLE_ID = "#actionTitle";

function setTitle(title) {
    $(TITLE_ID).text(title);
}

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
