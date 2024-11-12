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