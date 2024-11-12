/* ERROR FORM */
const ERROR_CONTAINER_ID = "#errorContainer";

/** Renders the given error */
function renderError(message) {
    hidePosts();
    $(FORM_PARENT_ID).empty();
    setTitle("Erreur du serveur...");

    let content = $(`<div>${message}</div>`);

    let container = $(ERROR_CONTAINER_ID);
    container.append(content);
    container.show();
}