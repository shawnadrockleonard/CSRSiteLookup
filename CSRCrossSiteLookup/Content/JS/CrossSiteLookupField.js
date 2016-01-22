var epaTemplates = window.epaTemplates || {};
epaTemplates.ListTitle = "Facility";
epaTemplates.FieldRequired = false;


epaTemplates.CrossSiteLookup = function () {

    var selectIdPrefix = "COL_";
    var errorIdPrefix = "ERR_";

    var self = this;

    // This function retrieves the value and renders html
    var _display = function (ctx, field) {

        var returnHtml = "";
        var fieldValId = 0;
        var fieldValTitle = "";
        var fieldValue = ctx.CurrentItem["CSRFacilityLookup"];
        if (fieldValue !== undefined && fieldValue !== "") {
            var fieldForm = self.SplitLookup(fieldValue);
            fieldValId = fieldForm.Id;
            fieldValTitle = fieldForm.Text;
        }

        if (ctx.inGridMode === undefined || ctx.inGridMode === false) {
            returnHtml += String.format("<div style='margin-left: 10px;'><a id='CSRLookupLink' title='{1}' href='/SiteAssets/JS/EnableJS.html' onclick='epaTemplates.CrossSiteLookup.openModal({0});return false;'>{1}</a></div>", fieldValId, fieldValTitle);
        }
        else {
            field.AllowGridEditing = false;
            returnHtml = fieldValTitle;
        }

        return returnHtml;
    };

    // This function provides the rendering logic
    var _edit = function (ctx) {

        // create form context object
        var formCtx = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

        // register our custom validator
        epaTemplates.FieldRequired = formCtx.fieldSchema.Required
        var validator = new SPClientForms.ClientValidation.ValidatorSet();
        validator.RegisterValidator(new epaTemplates.CrossSiteLookup.validator());
        formCtx.registerClientValidator(formCtx.fieldName, validator);

        // register our callbacks
        formCtx.registerGetValueCallback(formCtx.fieldName, epaTemplates.CrossSiteLookup.getValue.bind(null, formCtx.fieldName));
        formCtx.registerValidationErrorCallback(formCtx.fieldName, validator);

        epaTemplates.CrossSiteLookup.getOptions(formCtx);

        var html = "<span dir='none'> \
            <select id='" + selectIdPrefix + formCtx.fieldName + "' onChange='javascript:epaTemplates.CrossSiteLookup.onChange(this);'></select> \
            <input type='hidden' value='" + formCtx.fieldValue + "'  maxlength='255' id='" + formCtx.fieldName + "' class='ms-long'> \
            <br><span id='" + errorIdPrefix + formCtx.fieldName + "' class='ms-formvalidation ms-csrformvalidation'></span> \
            </span>";

        return html;
    };

    var _getOptions = function (ctx) {

        var lookupListTitle = epaTemplates.ListTitle;

        // construct the URL using the page context info to get the Web URL
        var requestUri = _spPageContextInfo.siteAbsoluteUrl +
                      "/_api/web/lists/getbytitle('" + lookupListTitle + "')/items?" +
                      "$select=Id,Title,FacilityID,Address,FacilityContact/Title,FacilityContact/EMail&$expand=FacilityContact/Id" +
                      "&$filter=TitleStatus eq 1";

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
    };

    var _renderOptions = function (formCtx, lookupItems) {

        // Pause till the DOM is ready
        $(document).ready(function () {

            var fieldName = formCtx.fieldName;
            var formFieldValue = formCtx.fieldValue.trim();
            var formFieldSelected = formFieldValue;
            var formFieldSelector = '#' + selectIdPrefix + fieldName;
            var formFieldInput = $(formFieldSelector);

            if (!epaTemplates.FieldRequired) {
                $("<option />", { value: "", text: "(None)" }).appendTo(formFieldInput);
            }

            if (formFieldValue !== undefined && formFieldValue !== "") {
                var splitItems = formFieldValue.split("#;");
                formFieldSelected = splitItems[0];
            }

            // loop through each of the returned items
            for (i = 0; i < lookupItems.length; i++) {
                var lookupItem = lookupItems[i];
                var lookupValueSelected = false;

                // append to the form field
                if (lookupItem.LookupId == formFieldSelected) {
                    lookupValueSelected = true;
                }

                $("<option />", {
                    value: lookupItem.LookupId,
                    text: lookupItem.LookupValue,
                    selected: lookupValueSelected
                }).appendTo(formFieldInput);

            }
        });
    }

    var _onChange = function (formField) {
        var fieldName = formField.id.replace(selectIdPrefix, "");
        var selectedIndex = formField.selectedIndex;
        var selectedOptions = formField.options;
        var str = "";

        var options = $.grep(selectedOptions, function (value, i) {
            return (value.index == selectedIndex);
        });

        $.each(options, function (idx, ivalue) {
            str += ivalue.value + "#;" + ivalue.text + "";
        });
        $('#' + fieldName).val(str);
    }

    // Return the value of the item after all interactions
    var _getValue = function (fieldName) {
        //var selector = '#' + selectIdPrefix + fieldName;
        var selector = '#' + fieldName;
        return $(selector).val();
    };

    // Custom validation object to validate email format
    var _validator = function () {

        epaTemplates.CrossSiteLookup.validator.prototype.Validate = function (value) {
            var isError = false;
            var errorMessage = "";

            //Regex expression
            var fieldRejex = /^(.?None.?\s?)?$/;
            if (epaTemplates.FieldRequired && (fieldRejex.test(value) || value.trim() === "")) {
                isError = true;
                errorMessage = "Choose a valid option";
            }
            //Send error message to error callback function (lookupOnError)
            return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
        };
    };


    var _modal = function (lookupId) {

        var lookupListTitle = epaTemplates.ListTitle;

        //Using a generic object.
        var options = {
            title: "Facility Information",
            width: 450,
            height: 200
        };

        var divElem = document.createElement('div');
        divElem.innerHTML = "<div id='divElm'>" +
            "<div class='splash'>" +
            "<div class='message'>Loading facility information...</div>" +
            "<i class='fa fa-spinner fa-2x fa-spin active'></i>" +
            "</div></div>";
        options.html = divElem;
        SP.UI.ModalDialog.showModalDialog(options);

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

                // pattern
                // Title [choose] / SSID / Address (st/state/zip) / Contact
                var result = data.d.results[0];

                // create an object and specify the values
                var resTitle = result.Title;
                var resFacilityUser = result.FacilityContact;
                var lookupItem = String.format("{0} / {1}", result.FacilityID, result.Address);
                var divHtml = "<span>" + resTitle + "</span>" +
                    "<div id='divAddress'>" + lookupItem + "</div>" +
                    "<div id='divContact'>" + resFacilityUser.Title + "</div>";
                $('#divElm').html(divHtml);
            },
            error: function (jqXHR, textStatus, errorThrown) {

                var errorMsg = { errorMessage: "Error: Failed to get Lookup Items" };
                epaTemplates.CrossSiteLookup.onError(ctx.fieldName, errorMsg);
            }
        });

        return false;
    };

    SplitLookup = function (svalue) {
        var nobject = {
            Id: 0,
            Text: svalue
        };

        if (svalue !== undefined && svalue !== "") {
            var splitField = svalue.split("#;");
            if (splitField.length > 0) {
                nobject.Id = splitField[0];
                nobject.Text = splitField[1];
            }
        }

        return nobject;
    };

    // Add error message to error element under the input field element
    var _onError = function (fieldName, error) {
        var selector = '#' + errorIdPrefix + fieldName;
        $(selector).html("<span role='alert'>" + error.errorMessage + "</span>");
    }

    return {
        "display": _display,
        "edit": _edit,
        "getValue": _getValue,
        "validator": _validator,
        "onError": _onError,
        "onChange": _onChange,
        "openModal": _modal,
        "getOptions": _getOptions,
        "renderOptions": _renderOptions
    }
}();
