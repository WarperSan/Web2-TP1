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