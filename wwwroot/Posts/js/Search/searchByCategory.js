/* CATEGORIES */
const CATEGORY_PARENT = "#categoryDropdown";
const CATEGORY_ADDED_DEFAULT = false;
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

    $(CATEGORY_PARENT).empty();

    for (const category of loadedCategories)
        renderCategory(category);
}

/** Renders the given category */
function renderCategory(category) {
    let checked = checkedCategories[category] !== false;

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

function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    });
    $('#allCatCmd').on("click", function () {
        showBookmarks();
        selectedCategory = "";
        updateDropDownMenu();
        pageManager.reset();
    });
    $('.category').on("click", function () {
        showBookmarks();
        selectedCategory = $(this).text().trim();
        updateDropDownMenu();
        pageManager.reset();
    });
}