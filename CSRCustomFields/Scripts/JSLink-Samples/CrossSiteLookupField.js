var lookupFieldContext = {};
lookupFieldContext.ListTitle = "asdf";
lookupFieldContext.FieldRequired = false;
lookupFieldContext.Templates = {};

(function () {

    (window.jQuery || document.write('<script src="//ajax.aspnetcdn.com/ajax/jquery/jquery-1.10.0.min.js"><\/script>'));


    // Create object that have the context information about the field that we want to change it's output render 
    function _registerFieldTemplate() {

        lookupFieldContext.Templates.Fields = {
            // Apply the new rendering for Email field on New and Edit Forms
            "RegionLkup": {
                "View": lookupGridTemplate,
                "NewForm": lookupFieldTemplate,
                "EditForm": lookupFieldTemplate
            }
        };

        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(lookupFieldContext);
    }

    ExecuteOrDelayUntilScriptLoaded(_registerFieldTemplate, 'clienttemplates.js');
})();

function lookupGridTemplate(ctx) {

    var formCtx = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

    debugger;

    //Create container for various validations
    lookupFieldContext.FieldRequired = formCtx.fieldSchema.Required
    var validators = new SPClientForms.ClientValidation.ValidatorSet();
    validators.RegisterValidator(new lookupFieldValidator());

    // Validation failure handler.
    formCtx.registerValidationErrorCallback(formCtx.fieldName, lookupOnError);

    formCtx.registerClientValidator(formCtx.fieldName, validators);

    lookupFieldContext.getOptionsFromLists(formCtx);


}

// This function provides the rendering logic
function lookupFieldTemplate(ctx) {

    var formCtx = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

    // Register a callback just before submit.
    formCtx.registerGetValueCallback(formCtx.fieldName, function () {
        return document.getElementById('RegionLkup').value;
    });

    //Create container for various validations
    lookupFieldContext.FieldRequired = formCtx.fieldSchema.Required
    var validators = new SPClientForms.ClientValidation.ValidatorSet();
    validators.RegisterValidator(new lookupFieldValidator());

    // Validation failure handler.
    formCtx.registerValidationErrorCallback(formCtx.fieldName, lookupOnError);

    formCtx.registerClientValidator(formCtx.fieldName, validators);

    lookupFieldContext.getOptionsFromLists(formCtx);

    var html = "<span dir='none'> \
            <select id='ddl"+ formCtx.fieldName + "'></select> \
            <input type='hidden' value='" + formCtx.fieldValue + "'  maxlength='255' id='" + formCtx.fieldName + "' class='ms-long'> \
            <br><span id='spnError' class='ms-formvalidation ms-csrformvalidation'></span> \
            </span>";

    return html;
}

lookupFieldContext.getOptionsFromLists = function (formCtx) {
    var lookupListTitle = lookupFieldContext.ListTitle;
    // construct the URL using the page context info to get the Web URL
    var requestUri = _spPageContextInfo.siteAbsoluteUrl +
                  "/_api/web/lists/getbytitle('" + lookupListTitle + "')/items?$filter=TitleStatus eq 1";

    // execute AJAX request
    $.ajax({
        url: requestUri,
        type: "GET",
        headers: { "ACCEPT": "application/json;odata=verbose" },
        success: function (data) {

            // store the lookup items here
            var lookupItems = new Array();

            // loop through each of the returned items
            $.each(data.d.results, function (i, result) {
                // for each one, create an object and specify the values
                var lookupItem = { LookupId: result.Id, LookupValue: result.Title };
                // push the object into our return array
                lookupItems.push(lookupItem);
            });

            lookupFieldContext.renderOptions(formCtx, lookupItems);
            lookupFieldContext.ExtendHandlers(formCtx);
        },
        error: function () {
            var divId = '#spnError';

            $(divId).html('Error: Failed to get Lookup Items');
        }
    });
}

lookupFieldContext.renderOptions = function (formCtx, lookupItems) {

    // Pause till the DOM is ready
    $(document).ready(function () {

        var formFieldValue = formCtx.fieldValue.trim();
        var formFieldInput = $('#ddl' + formCtx.fieldName);

        if (!lookupFieldContext.FieldRequired) {
            $("<option />", { value: "", text: "(None)" }).appendTo(formFieldInput);
        }

        // loop through each of the returned items
        for (i = 0; i < lookupItems.length; i++) {
            var lookupItem = lookupItems[i];
            // append to the form field
            if (lookupItem.LookupValue == formFieldValue) {
                $("<option />", {
                    value: lookupItem.LookupId,
                    text: lookupItem.LookupValue,
                    selected: true
                }).appendTo(formFieldInput);
            }
            else {
                $("<option />", { value: lookupItem.LookupId, text: lookupItem.LookupValue }).appendTo(formFieldInput);
            }
        }
    });
}

lookupFieldContext.ExtendHandlers = function (formCtx) {

    $("#ddl" + formCtx.fieldName).change(function () {
        var str = "";
        var s = $('#' + this.id + ' option:selected');
        s.each(function () {
            str += $(this).text() + "";
        });
        $('#' + formCtx.fieldName).val(str);
    });
}

// Custom validation object to validate email format
lookupFieldValidator = function () {

    lookupFieldValidator.prototype.Validate = function (value) {
        var isError = false;
        var errorMessage = "";

        //Email format Regex expression
        var emailRejex = /^(.?None.?\s?)?$/;
        if (lookupFieldContext.FieldRequired && (emailRejex.test(value) || value.trim() === "")) {
            isError = true;
            errorMessage = "Choose a valid option";
        }
        //Send error message to error callback function (lookupOnError)
        return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
    };
};

// Add error message to spnError element under the input field element
function lookupOnError(error) {
    document.getElementById("spnError").innerHTML = "<span role='alert'>" + error.errorMessage + "</span>";
}
