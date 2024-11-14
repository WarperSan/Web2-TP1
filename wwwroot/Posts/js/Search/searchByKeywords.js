/* KEYWORDS */
const KEYWORD_ID = "#search-text";
const SEARCH_BUTTON_ID = "#doSearch";
let keywords = undefined;

/** Sets the current search keywords */
function updateSearch()
{
    let searchString = $(KEYWORD_ID).val().trim();
    if (searchString === '')
        keywords = undefined;
    else
        keywords = searchString;

    addWaitingLogo();
    pageManager.reset();
}

$(KEYWORD_ID).on('keydown', function (e) {
    if (e.originalEvent.keyCode !== 13)
        return;

    updateSearch();
});
$(SEARCH_BUTTON_ID).on("click", function (e) {
   updateSearch();
});