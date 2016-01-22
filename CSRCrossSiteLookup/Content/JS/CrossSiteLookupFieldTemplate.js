(function () {

    // Create object that have the context information about the field that we want to change it's output render 
    var fieldOverrides = {
        Templates: {
            Fields: {
                'CSRFacilityLookup': {
                    'DisplayForm': epaTemplates.CrossSiteLookup.display,
                    'View': epaTemplates.CrossSiteLookup.display,
                    'EditForm': epaTemplates.CrossSiteLookup.edit,
                    'NewForm': epaTemplates.CrossSiteLookup.edit
                }
            }
        }
    };

    // register our templates
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(fieldOverrides);
})();