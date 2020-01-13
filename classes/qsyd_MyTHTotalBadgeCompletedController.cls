global class qsyd_MyTHTotalBadgeCompletedController {
 
    @AuraEnabled 
    public static String getCustomMetadataMyTrailheadInstanceDomainName(){ 
        myTrailhead_Domain_Setting__mdt[] custMetadataMyTHRecords = [SELECT MasterLabel, DomainName__c FROM myTrailhead_Domain_Setting__mdt LIMIT 1]; 
        //If there is no custom metadata configured, return null;
        if(custMetadataMyTHRecords.size() == 0 || String.isEmpty(custMetadataMyTHRecords[0].DomainName__c)){
            return null;
        } else {
            return custMetadataMyTHRecords[0].DomainName__c; 
        }
    } 

    @AuraEnabled
    public static List<myTH_UserDetail> getAllTrailheadUserDataList(){
        List<myTH_UserDetail> trailheadUserDataWrapperList = new List<myTH_UserDetail> ();
        trailheadapp__Trailhead_User_Data__c u;
        Integer i,j = 0, currentRankIdx = 1, currentRankPoint = 0;

        List<trailheadapp__Trailhead_User_Data__c> trailheadUserDataList = [
        SELECT trailheadapp__Avatar__c, trailheadapp__Profile_URL__c, trailheadapp__Profile_Visibility__c,trailheadapp__Rank__c, trailheadapp__Total_Points__c, trailheadapp__User__c, Name, Id FROM trailheadapp__Trailhead_User_Data__c Order By trailheadapp__Total_Points__c DESC];  
        //Highest point
        if(trailheadUserDataList.size() > 0){
            currentRankPoint = (Integer) trailheadUserDataList[0].trailheadapp__Total_Points__c; 
        } else {
            return trailheadUserDataWrapperList;
        }
       

        List<trailheadapp__User_Badge__c> userBadgesList = [SELECT trailheadapp__Badge__r.trailheadapp__API_Name__c,trailheadapp__Badge__r.Id, trailheadapp__Badge__r.Name, trailheadapp__Badge__r.trailheadapp__Icon__c, trailheadapp__Badge__r.trailheadapp__Type__c,trailheadapp__Badge__r.trailheadapp__URL__c, trailheadapp__User__c FROM trailheadapp__User_Badge__c WHERE trailheadapp__Badge__r.trailheadapp__Archived__c = false  AND trailheadapp__Status__c = 'Completed'];

        //Map<User,User's completed badges details> - output: userBadgesList2DMap
        Map<String,List<trailheadapp__User_Badge__c>> userBadgesList2DMap = new Map<String,List<trailheadapp__User_Badge__c>>();
        for(i = 0; i < userBadgesList.size(); i++){ 
            if(userBadgesList2DMap.get(userBadgesList[i].trailheadapp__User__c) == null){
                   userBadgesList2DMap.put(userBadgesList[i].trailheadapp__User__c, new List<trailheadapp__User_Badge__c>()); 
            }
            //Update this user's badges list with the new iterated record
            List<trailheadapp__User_Badge__c> currentUserBadgesList = userBadgesList2DMap.get(userBadgesList[i].trailheadapp__User__c);
            currentUserBadgesList.add(userBadgesList[i]);
        } 

        //trailheadUserDataWrapper Array List - output: trailheadUserDataWrapperList
        for(i = 0; i < trailheadUserDataList.size(); i++){
            u = trailheadUserDataList[i];
            myTH_UserDetail thisUserWrapper = new myTH_UserDetail();
            thisUserWrapper.trailheadUserDataRecord = u; 
            if (u.trailheadapp__Total_Points__c < currentRankPoint) {
                currentRankPoint = (Integer) u.trailheadapp__Total_Points__c;
                currentRankIdx += 1;
            }
            thisUserWrapper.userLeaderboardRank = currentRankIdx;
            thisUserWrapper.userCompletedUserBadgesList = userBadgesList2DMap.get(u.trailheadapp__User__c);
            trailheadUserDataWrapperList.add(thisUserWrapper);
        } 

        return trailheadUserDataWrapperList;
    }

    @AuraEnabled
    public static String getCurrentUserId(){
        return UserInfo.getUserId();
    } 

    public with sharing class myTH_UserDetail {
        @AuraEnabled
        public trailheadapp__Trailhead_User_Data__c trailheadUserDataRecord {get; set;}
        @AuraEnabled
        public List<trailheadapp__User_Badge__c> userCompletedUserBadgesList {get; set;}
        @AuraEnabled
        public Integer userLeaderboardRank {get; set;}
    }
 
}