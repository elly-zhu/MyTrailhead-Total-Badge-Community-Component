({
    callServer: function (component, method, callback, params) {
        let action = component.get(method);
        if (params) {
            action.setParams(params);
        }

        action.setCallback(this, function (response) {
            const state = response.getState();
            if (state === "SUCCESS") {
                // pass returned value to callback function
                callback.call(this, response.getReturnValue());
            } else if (state === "ERROR") {
                // generic error handler
                var errors = response.getError();
                if (errors) {
                    console.log("Errors", errors);
                    if (errors[0] && errors[0].message) {
                        throw new Error("Error" + errors[0].message);
                    }
                } else {
                    throw new Error("Unknown Error");
                }
            }
        });

        $A.enqueueAction(action);
    },

    initMyTrailheadInstanceDomainVal: function (component, event, helper) {
        //Get custom metedata - myTrailheadInstance - Domain Name
        helper.callServer(
            component,
            "c.getCustomMetadataMyTrailheadInstanceDomainName",
            function (response) {
                if (response) {
                    component.set('v.myTHInstanceDomainName', response.trim());
                    // console.log('>> myTHInstanceDomainName: ' + component.get('v.myTHInstanceDomainName'));
                    helper.initCommunityDomainName(component, event, helper);
                } else {
                    component.set('v.errorMessage', 'Please setup the myTrailhead Instance Domain Name in custom metadata and try again.');
                    component.set('v.showSpinner', false);
                    component.set('v.hasError', true);
                }
            }, {}
        );
    },

    initCommunityDomainName: function (component, event, helper) {
        let communityDomainName = component.get('v.myTrailheadCommunityDomain');
        let communityPrefix = $A.get("$SfdcSite").pathPrefix || '';
        if (!(communityDomainName != null && communityDomainName.length > 0)) {
            communityDomainName = window.location.hostname;
            communityDomainName = communityDomainName + communityPrefix;
            component.set('v.myTrailheadCommunityDomain', communityDomainName);
        }
        helper.initTrailheadUserDataList(component, event, helper);

    },

    initTrailheadUserDataList: function (component, event, helper) {
        component.set('v.showSpinner', true);
        let uIdx, i, tile;
        const sitePrefix = '/sfsites/c';
        let currentUserId = component.get('v.currentUserId');
        helper.callServer(
            component,
            "c.getAllTrailheadUserDataList",
            function (response) {
                if (response) {
                    debugger
                    for (uIdx = 0; uIdx < response.length; uIdx++) {
                        response[uIdx].tiles = [];
                        let userBadgesList = response[uIdx].userCompletedUserBadgesList || [];
                        for (i = 0; i < userBadgesList.length; i++) {
                            tile = {};
                            tile.name = userBadgesList[i].trailheadapp__Badge__r.Name;
                            tile.icon = userBadgesList[i].trailheadapp__Badge__r.trailheadapp__Icon__c;
                            tile.url = helper.setCommunitySSO(component, event, helper, userBadgesList[i].trailheadapp__Badge__r.trailheadapp__URL__c);
                            if (tile.icon) {
                                if (tile.icon.startsWith("/resource") || tile.icon.startsWith('resource')) {
                                    if (tile.icon.charAt(0) != '/') {
                                        tile.icon = '/' + tile.icon;
                                    }
                                    tile.icon = sitePrefix.concat(tile.icon);
                                }
                            } else {
                                tile.icon = '';
                            }
                            response[uIdx].tiles.push(tile);
                        }
                        if (response[uIdx].trailheadUserDataRecord.trailheadapp__User__c == currentUserId) {
                            component.set('v.myTHUserDetail', response[uIdx]);
                            component.set('v.myTHUserCompletedBadges', response[uIdx].tiles);
                        }
                    }
                    component.set('v.trailheadUserDataList', response);
                    console.log('trailheadUserDataList: ' + component.get('v.trailheadUserDataList'));
                    component.set('v.showSpinner', false);
                } else {
                    component.set('v.trailheadUserDataList', null);
                    component.set('v.errorMessage', 'There is no trailhead user data');
                    component.set('v.showSpinner', false);
                    component.set('v.hasError', true);
                }
            }, {}
        );
    },

    getCurrentUserId: function (component, event, helper) {
        helper.callServer(
            component,
            "c.getCurrentUserId",
            function (response) {
                debugger
                if (response) {
                    component.set('v.currentUserId', response);
                } else {
                    component.set('v.errorMessage', 'Current user id cannot found');
                    component.set('v.hasError', true);
                }
                component.set('v.showSpinner', false);
            }, {}
        );
    },

    checkTilesIcons: function (component, event, helper, myTHUserCompletedBadges) {
        component.set('v.showSpinner', true);
        const sitePrefix = '/sfsites/c';
        //Community Prefix - Static Resource Image Url Padding
        for (let i = 0; i < myTHUserCompletedBadges.length; i++) {
            if (myTHUserCompletedBadges[i].icon) {
                if (myTHUserCompletedBadges[i].icon.startsWith("/resource") || myTHUserCompletedBadges[i].icon.startsWith('resource')) {
                    if (myTHUserCompletedBadges[i].icon.charAt(0) != '/') {
                        myTHUserCompletedBadges[i].icon = '/' + myTHUserCompletedBadges[i].icon;
                    }
                    myTHUserCompletedBadges[i].icon = sitePrefix.concat(myTHUserCompletedBadges[i].icon);
                }
            } else {
                myTHUserCompletedBadges[i].icon = '';
            }
        }

        component.set('v.showSpinner', false);
        return myTHUserCompletedBadges;
    },



    setCommunitySSO: function (component, event, helper, reponseVarURL) {
        const myTHDomainName = component.get('v.myTHInstanceDomainName');
        const myCommunityDomainName = component.get('v.myTrailheadCommunityDomain');
        const isPrivate = reponseVarURL.indexOf('.my.trailhead.com') > 0 ? true : false;
        let communityPrefix = 'http://trailblazer.me/relay?communitydomain=' + myCommunityDomainName;
        let privateSpacePrefix = communityPrefix + '&community=' + myTHDomainName + '.my.trailhead';
        let publicSpacePrefix = communityPrefix + '&community=trailhead';

        let subUrlForBadgeAndTrailPrivate = reponseVarURL.substring(reponseVarURL.indexOf('/content/') + ('/content/').length);
        let subUrlForBadgeAndTrailPublic = reponseVarURL.substring(reponseVarURL.indexOf('/trailhead/') + ('/trailhead/').length);

        if (subUrlForBadgeAndTrailPublic.indexOf('super_badges') > -1) {
            subUrlForBadgeAndTrailPublic = subUrlForBadgeAndTrailPublic.replace('super_badges', 'superbadges');
        } else if (subUrlForBadgeAndTrailPublic.indexOf('project') > -1) {
            subUrlForBadgeAndTrailPublic = subUrlForBadgeAndTrailPublic.replace('project', 'projects');
        } else if (subUrlForBadgeAndTrailPublic.indexOf('module') > -1) {
            subUrlForBadgeAndTrailPublic = subUrlForBadgeAndTrailPublic.replace('module', 'modules');
        } else if (subUrlForBadgeAndTrailPublic.indexOf('trail') > -1) {
            subUrlForBadgeAndTrailPublic = subUrlForBadgeAndTrailPublic.replace('trail', 'trails');
        }
        //debugger
        if (isPrivate) {
            return privateSpacePrefix + '&path=/content/' + subUrlForBadgeAndTrailPrivate;
        } else {

            return publicSpacePrefix + '&path=/content/learn/' + subUrlForBadgeAndTrailPublic;
        }
    },

})