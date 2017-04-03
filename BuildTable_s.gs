/*
 * CONSTRUCTOR object to attach to and update the Iced Drinks Build Table
 * Contains all the info needed to create the current batch of drinks
 * Used here to"
 *  1. push the new calculated values for the next build
 *  2. Read from to create a snapshot in the BuildHistory for future calculations
 *
 * Constructed with 'buildId': the build sheet number to attach to
 *   1 = Monday
 *   2 = Thursday
 *
 * @constructor
 * @param {int} buildId - the build Id of thetable we are linked to
 * @param {Object} fileIds - Spreadsheet file Ids for the Iced Drinks files
*/
function BuildTable(buildId, fileIds) {
  this.buildSheet = null;
  this.buildId = -1;
  this.sheetId = null;
  this.sheetNamePrefix = 'Build!';  // Needed to prefix range names
  this.buildToOffset = 0;
  this.inFridgeOffset = 1;
  this.deadOffset = 2;

  ASSERT_TRUE(typeof buildId == "number", "Valid buildId missing from BuildTable Constructor");
  ASSERT_TRUE(buildId == 1 || buildId == 2, "Unrecognised buildId in BuildTable Constructor '" + buildId + "'");

  var buildSheetId = buildId == 1 ? fileIds.mondayBuild : fileIds.thursdayBuild;
    
  this.buildSheet = SpreadsheetApp.openById(buildSheetId);
  ASSERT_TRUE(this.buildSheet != null, "Error trying to open build sheet " + buildId + " with Id '" + buildSheetId + "'");
  
  this.buildId = buildId;
  this.sheetId = buildSheetId;
}


BuildTable.prototype = {
/*
 * getBuildSummary: Pull out the relevant info from the Build Table Sheet and create a BuildSummary object to represent it
 * @param {string[]} siteNames - list of configured site names we are working with
 * @param {string[]} drinkTypes - list of configured drink types we are working with
 * @returns {object} - a BuildSummary object containing all the relevant info from this BuildTable we are linked to 
 */
  getBuildSummary: function(siteNames, drinkTypes) {
    ASSERT_TRUE(typeof siteNames != "undefined", "Invalid siteNames argument passed to getBuildSummaries");
    ASSERT_TRUE(typeof drinkTypes != "undefined", "Invalid drinkTypes argument passed to getBuildSummaries");
    ASSERT_TRUE(siteNames.length>0, "Empty siteNames array passed to getBuildSummaries");
    ASSERT_TRUE(drinkTypes.length>0, "Empty drinkTypes array passed to getBuildSummaries");
    var today = new Date();
    var summary = new BuildSummary(today, siteNames, this.buildId);
    for (var i=0; i<siteNames.length; i++) {
      var siteName = siteNames[i];
      var site = new Site(siteNames, i);
      var buildTo = new IcedDrinks(drinkTypes);
      var inFridge = new IcedDrinks(drinkTypes);
      var dead = new IcedDrinks(drinkTypes);
      for (var j=0; j<drinkTypes.length; j++) {
        var drink = buildTo.drinkTypes[j];
        var range = this.buildSheet.getRangeByName(this.sheetNamePrefix + drink);
        ASSERT_TRUE(range!=null, "Range '" + this.sheetNamePrefix + drink + "' not found in buildId " + this.buildId + " with Id '" + this.sheetId + "'");
        
        buildTo.add(drink, parseInt(range.getValues()[0][site.buildTableOffset + this.buildToOffset]));
        inFridge.add(drink, parseInt(range.getValues()[0][site.buildTableOffset + this.inFridgeOffset]));
        dead.add(drink, parseInt(range.getValues()[0][site.buildTableOffset + this.deadOffset]));
      }
      var build = new SiteBuild(today, site, this.buildId, buildTo, inFridge, dead);
      summary.addBuild(build);
    }
    
    return summary;
  },
  
/*
 * setNewtargets: update the build table sheet to reflect the new targets we now have
 * @param {Object} targets - A DrinksSummary object containing counts of all drinks accross all sites
 */
  setNewTargets: function(targets)
  {
    Logger.log("===> BuildTable.setNewTargets");
    Logger.log(targets.toString());
    
    for (var si=0; si<targets.numSites; si++) {
      var drinks=targets.site[si].drinks;
      var site = new Site(targets.siteNames, si);
      for (var dti=0; dti<drinks.drinkTypes.length; dti++) {
        var drinkName = drinks.drinkTypes[dti];
        var range = this.buildSheet.getRangeByName(this.sheetNamePrefix + drinkName);
        ASSERT_TRUE(range!=null, "Range '" + this.sheetNamePrefix + drinkName + "' not found in buildId " + this.buildId + " with Id '" + this.sheetId + "'");
        var row=range.getValues();
        row[0][site.buildTableOffset + this.buildToOffset] = drinks.count[drinkName];
        range.setValues(row);
      }
    }
    Logger.log("<===");
    
  }
}