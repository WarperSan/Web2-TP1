/* CATEGORIES */
const CATEGORY_PARENT = "#categoryDropdown";
const CATEGORY_ADDED_DEFAULT = true;
const CATEGORY_CHECKED_CLASS = "fa-check";
const CATEGORY_UNCHECKED_CLASS = "fa-fw";

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

    for (const category of loadedCategories) {
        if (checkedCategories.hasOwnProperty(category))
            continue;

        checkedCategories[category] = CATEGORY_ADDED_DEFAULT;
    }

    $(CATEGORY_PARENT).empty();

    for (const category of loadedCategories)
        renderCategory(category);
}

/** Renders the given category */
function renderCategory(category) {
    let checked = checkedCategories[category] === true;

    let element = $(`
        <div class="dropdown-item menuItemLayout category" id="allCatCmd" data-checked="${checked}" data-name="${category}">
            <i class="menuIcon fa ${checked ? CATEGORY_CHECKED_CLASS : CATEGORY_UNCHECKED_CLASS} mx-2"></i> ${category}
        </div>
    `);

    element.on("click", function () {

        let checked = $(this).data("checked");
        checked = !checked;
        $(this).data("checked", checked);
        checkedCategories[$(this).data("name")] = checked;

        let icon = $(this).children(".menuIcon");
        if (checked) {
            icon.addClass(CATEGORY_CHECKED_CLASS);
            icon.removeClass(CATEGORY_UNCHECKED_CLASS);
        } else {
            icon.removeClass(CATEGORY_CHECKED_CLASS);
            icon.addClass(CATEGORY_UNCHECKED_CLASS);
        }

        selectedCategories = Object.keys(checkedCategories).filter(key => checkedCategories[key]);

        addWaitingLogo();
        pageManager.reset();
    });

    $(CATEGORY_PARENT).append(element);
}