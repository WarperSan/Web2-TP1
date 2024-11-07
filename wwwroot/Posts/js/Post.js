const POST_PARENT = "#posts-parent";
const CATEGORY_PARENT = ".post-categories-dropdown .content";

const CATEGORY_ADDED_DEFAULT = false;

let manager = new PostsManager(renderItems, renderCategories);
let checkedCategories = {};
let hasLoaded = false;

/** Renders all the given items */
function renderItems(items) {
    // Empty content
    $(POST_PARENT).empty();

    for (const item of items) {
        // If category not added yet, add
        if (checkedCategories[item.Category] === undefined)
            checkedCategories[item.Category] = !hasLoaded || CATEGORY_ADDED_DEFAULT;

        renderItem(item);
    }

    // Hide loader
    $(".loader-container").hide();
    hasLoaded = true;
}

/** Renders the given item */
function renderItem(item, atEnd = true) {

    let element = $(`
        <div class="post" data-id="${item.Id}">
            <!-- HEADER -->
            <div class="post-header">
                <span class="post-category">${item.Category.toUpperCase()}</span>
                <div style="flex: 1;"><!-- BUTTONS --></div>
            </div>
            <span class="post-title">${item.Title}</span>
            <img class="post-image" style="background-image: url('${item.Image}');"  alt=""/>
            <span class="post-date">${convertToFrenchDate(item.Creation)}</span>
            <span class="post-text">TEXTE: ${item.Text}</span>
        </div>
        <hr>
    `);

    if (atEnd)
        $(POST_PARENT).append(element);
    else
        $(POST_PARENT).prepend(element);
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

/** Renders all the given categories */
function renderCategories(categories) {
    $(CATEGORY_PARENT).empty();

    for (const category of categories)
        renderCategory(category);

    $(".post-categories-dropdown .content li input").change(function () {
        checkedCategories[$(this).val()] = $(this).is(":checked");

        let keys = Object.keys(checkedCategories).filter(key => checkedCategories[key]);

        $(".loader-container").show();
        manager.setCategories(keys);
    });
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

    $(CATEGORY_PARENT).append(element);
}