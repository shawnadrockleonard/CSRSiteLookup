// Get parameters from the query string.
// For production purposes you may want to use a library to handle the query string.
function getQueryStringParameter(paramToRetrieve) {
    var params = document.URL.split("?")[1].split("&");
    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve) return singleParam[1];
    }
}

// Pause till the DOM is ready
$(document).ready(function () {

    var lookupListTitle = getQueryStringParameter("lookupListTitle");
    var lookupId = getQueryStringParameter("lookupId");

    // construct the URL using the page context info to get the Web URL
    var requestUri = "/_api/web/lists/getbytitle('" + lookupListTitle + "')/items?" +
                  "$select=Id,Title,FacilityID,Address,FacilityContact/Title,FacilityContact/EMail&$expand=FacilityContact/Id" +
                  "&$filter=Id eq " + lookupId;

    // execute AJAX request
    $.ajax({
        url: requestUri,
        type: "GET",
        headers: { "ACCEPT": "application/json;odata=verbose" },
        success: function (data) {

            // store the lookup items here
            var lookupItems = new Array();

            // pattern
            // Title [choose] / SSID / Address (st/state/zip) / Contact

            // loop through each of the returned items
            $.each(data.d.results, function (i, result) {
                // for each one, create an object and specify the values
                var resTitle = result.Title;
                var resFacilityUser = result.FacilityContact;
                var lookupItem = {
                    LookupId: result.Id,
                    LookupValue: resTitle,
                    Display: String.format("{0} / {1} / {2} / {3}", resTitle, result.FacilityID, result.Address, resFacilityUser.Title)
                };
                // push the object into our return array
                lookupItems.push(lookupItem);
            });

            epaTemplates.CrossSiteLookup.renderOptions(ctx, lookupItems);
        },
        error: function (jqXHR, textStatus, errorThrown) {

            var errorMsg = { errorMessage: "Error: Failed to get Lookup Items" };
            epaTemplates.CrossSiteLookup.onError(ctx.fieldName, errorMsg);
        }
    });


});