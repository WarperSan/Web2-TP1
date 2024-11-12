let categories = [];
let selectedCategory = "";
let currentETag = "";
let pageManager;

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
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
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
async function renderBookmarks(queryString) {
    let endOfData = false;
    queryString += "&sort=category";
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    addWaitingGif();
    let response = await Bookmarks_API.Get(queryString);
    if (!Bookmarks_API.error) {
        currentETag = response.ETag;
        let Bookmarks = response.data;
        if (Bookmarks.length > 0) {
            Bookmarks.forEach(Bookmark => {
                $("#itemsPanel").append(renderBookmark(Bookmark));
            });
            $(".editCmd").off();
            $(".editCmd").on("click", function () {
                renderEditBookmarkForm($(this).attr("editBookmarkId"));
            });
            $(".deleteCmd").off();
            $(".deleteCmd").on("click", function () {
                renderDeleteBookmarkForm($(this).attr("deleteBookmarkId"));
            });
        } else
            endOfData = true;
    } else {
        renderError(Bookmarks_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
async function renderEditBookmarkForm(id) {
    addWaitingGif();
    let response = await Bookmarks_API.Get(id)
    if (!Bookmarks_API.error) {
        let Bookmark = response.data;
        if (Bookmark !== null)
            renderBookmarkForm(Bookmark);
        else
            renderError("Bookmark introuvable!");
    } else {
        renderError(Bookmarks_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeleteBookmarkForm(id) {
    hideBookmarks();
    $("#actionTitle").text("Retrait");
    $('#bookmarkForm').show();
    $('#bookmarkForm').empty();
    let response = await Bookmarks_API.Get(id)
    if (!Bookmarks_API.error) {
        let Bookmark = response.data;
        let favicon = makeFavicon(Bookmark.Url);
        if (Bookmark !== null) {
            $("#bookmarkForm").append(`
        <div class="BookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="BookmarkRow" id=${Bookmark.Id}">
                <div class="BookmarkContainer noselect">
                    <div class="BookmarkLayout">
                        <div class="Bookmark">
                            <a href="${Bookmark.Url}" target="_blank"> ${favicon} </a>
                            <span class="BookmarkTitle">${Bookmark.Title}</span>
                        </div>
                        <span class="BookmarkCategory">${Bookmark.Category}</span>
                    </div>
                    <div class="BookmarkCommandPanel">
                        <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${Bookmark.Id}" title="Modifier ${Bookmark.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${Bookmark.Id}" title="Effacer ${Bookmark.Title}"></span>
                    </div>
                </div>
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
            $('#deleteBookmark').on("click", async function () {
                await Bookmarks_API.Delete(Bookmark.Id);
                if (!Bookmarks_API.error) {
                    showBookmarks();
                    await pageManager.update(false);
                    compileCategories();
                }
                else {
                    console.log(Bookmarks_API.currentHttpError)
                    renderError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", function () {
                showBookmarks();
            });

        } else {
            renderError("Bookmark introuvable!");
        }
    } else
        renderError(Bookmarks_API.currentHttpError);
}
function makeFavicon(url, big = false) {
    // Utiliser l'API de google pour extraire le favicon du site pointé par url
    // retourne un élément div comportant le favicon en tant qu'image de fond
    ///////////////////////////////////////////////////////////////////////////
    if (url.slice(-1) != "/") url += "/";
    let faviconClass = "favicon";
    if (big) faviconClass = "big-favicon";
    url = "http://www.google.com/s2/favicons?sz=64&domain=" + url;
    return `<div class="${faviconClass}" style="background-image: url('${url}');"></div>`;
}
function renderBookmark(Bookmark) {
    let favicon = makeFavicon(Bookmark.Url);
    return $(`
     <div class="BookmarkRow" id='${Bookmark.Id}'>
        <div class="BookmarkContainer noselect">
            <div class="BookmarkLayout">
                <div class="Bookmark">
                    <a href="${Bookmark.Url}" target="_blank"> ${favicon} </a>
                    <span class="BookmarkTitle">${Bookmark.Title}</span>
                </div>
                <span class="BookmarkCategory">${Bookmark.Category}</span>
            </div>
            <div class="BookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${Bookmark.Id}" title="Modifier ${Bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${Bookmark.Id}" title="Effacer ${Bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}
