$(document).ready(function () {
    let isCategoryOpen = true;
    let content = $(".post-categories-dropdown .content");

    function setOpen(isOpen) {
        // If already correct state, skip
        if (isCategoryOpen === isOpen)
            return;

        isCategoryOpen = isOpen;

        // Enable hit boxes
        if (isCategoryOpen)
            content.show();

        content.animate({
            opacity: isCategoryOpen ? 1 : 0,
        }, 200, function () {

            // Disable hit boxes
            if (!isCategoryOpen)
                content.hide();
        });
    }

    $(".post-categories-dropdown").click(function (e) {
        e.stopPropagation();

        setOpen(true);
    });

    $("html, body").click(function (){
        setOpen(false);
    });

    setOpen(false);
});