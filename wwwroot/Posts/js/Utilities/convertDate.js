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