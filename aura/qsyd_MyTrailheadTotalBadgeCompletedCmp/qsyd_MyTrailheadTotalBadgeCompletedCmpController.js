({
    handleInit: function (component, event, helper) {
        helper.getCurrentUserId(component, event, helper);
        helper.initMyTrailheadInstanceDomainVal(component, event, helper);
    }
})