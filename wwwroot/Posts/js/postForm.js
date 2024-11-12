/* POST FORM */
const FORM_PARENT_ID = "#formParent";
const POST_FORM_ID = "#postForm";
const POST_FORM_CANCEL_ID = "#postCancelForm";

/** Fetches the data of the given form */
function getFormData(form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    let jsonObject = {};
    $.each(form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderPostForm(post = undefined) {
    hidePosts();

    let isCreating = post === undefined;

    if (isCreating)
    {
        post = createPost();
        setTitle("Création");
    }
    else
    {
        setTitle("Modification");
    }

    let parent = $(FORM_PARENT_ID);
    parent.empty();

    parent.append(`
        <form class="form" id="${POST_FORM_ID.substring(1)}">
            <!-- POST ID -->
            <input type="hidden" name="Id" value="${post.Id}" />
            
            <!-- POST CREATION DATE-->
            <input type="hidden" name="Creation" value="${Date.now()}" />

            <!-- POST TITLE -->
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                value="${post.Title || ""}"
            />
            <br>
            
            <!-- POST CATEGORY -->
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category || ""}"
            />
            <br>
            
            <!-- POST IMAGE -->
            <label for="Image" class="form-label">Image </label>
            <div
                class='imageUploader' 
                newImage='${isCreating}' 
                controlId='Image' 
                imageSrc='${post.Image || "Posts/images/no-image.png"}' 
                waitingImage="Posts/Loading_icon.gif">
            </div>
            <br>
            
            <!-- POST TEXT -->
            <label for="Text" class="form-label">Texte </label>
            <textarea
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Texte"
                required>${post.Text || ""}</textarea>
            
            <br>
            <!-- BUTTONS -->
            <input type="submit" value="Enregistrer" class="btn btn-primary">
            <input type="button" value="Annuler" id="${POST_FORM_CANCEL_ID.substring(1)}" class="btn btn-secondary">
        </form>
    `);
    parent.show();

    initImageUploaders();
    initFormValidation();

    $(POST_FORM_ID).on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($(this));

        let result = await Posts_API.Save(post, isCreating);

        if (result.isError) {
            renderError("Une erreur est survenue!");
            return;
        }

        showPosts();

        await pageManager.update(false);
        pageManager.scrollToElem(result.Id);

        await compileCategories();
    });

    $(POST_FORM_CANCEL_ID).on("click", showPosts);
}