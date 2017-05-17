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
  getDataSet: function(siteNames, drinkTypes) {
    var dt, si, range, values, drink, site;
    var set = {data: {}};
    var rObj = {};
      
    // Initialise the data set
    siteNames.forEach(function(siteName) {
      this.data[siteName] = {};
    }, set);
      
    // pull the data in from the buildTable spreadsheet
    for (dt=0; dt < drinkTypes.length; dt++) {
      drink = drinkTypes[dt];
      var range = this.buildSheet.getRangeByName(this.sheetNamePrefix + drink);
      ASSERT_TRUE(range!=null, "Range '" + this.sheetNamePrefix + drink + "' not found");
      values = range.getValues()[0];
      
      for (si=0; si<siteNames.length; si++) {
        site = siteNames[si];
        set.data[site][drink] = values.slice(si + si*3, si + si*3 + 3);
      }
    };
    
    // set up the helper functions
    var getSiteData = function(site) {
      return set.data[site];
    };      
    var getSiteDrinkData = function (site, drink) {
      return set.data[site][drink];
    };
      
    //rObj.set = set; // for debugging purposes
    rObj.getSiteData = getSiteData;
    rObj.getSiteDrinkData = getSiteDrinkData;
      
    return rObj;
  },
  
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
    var dataSet, site, siteName, drink, buildTo, inFridge, dead, build;
       
    // grab the build data set from the build table spreadsheet
    dataSet = this.getDataSet(siteNames, drinkTypes);
    //Logger.log(dataSet);
    
    var getNumeric = function(val, siteName, drink, name) {
      if (isNaN(val)) {
        Logger.log("==ERROR== Found non numeric value '" + val + "' for " + name + "(" + siteName + "," + drink + ") - using 0");
        return 0;
      }
      else
        return parseInt(val);
    }

    // populate the Iced Drinks structures and attach them to a new SiteBuild which is then added to the BuildSummary
    for (var i=0; i<siteNames.length; i++) {
      siteName = siteNames[i];
      site = new Site(siteNames, i);
      buildTo = new IcedDrinks(drinkTypes);
      inFridge = new IcedDrinks(drinkTypes);
      dead = new IcedDrinks(drinkTypes);
      for (var dt=0; dt<drinkTypes.length; dt++) {
        drink = drinkTypes[dt];          
        buildTo.add(drink, getNumeric(dataSet.getSiteDrinkData(siteName, drink)[this.buildToOffset], siteName, drink, "buildTo"));
        inFridge.add(drink, getNumeric(dataSet.getSiteDrinkData(siteName, drink)[this.inFridgeOffset], siteName, drink, "inFridge"));
        dead.add(drink, getNumeric(dataSet.getSiteDrinkData(siteName, drink)[this.deadOffset], siteName, drink, "dead"));
      }
      build = new SiteBuild(today, site, this.buildId, buildTo, inFridge, dead);
      summary.addBuild(build);
    }
    
    return summary;
  
    /* original code
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
        var values = range.getValues()[0];
        
        var getNumeric = function(name, val) {
          if (isNaN(val)) {
            Logger.log("==ERROR== Found non numeric value '" + val + "' for " + name + "(" + siteName + "," + drink + ") - using 0");
            return 0;
          }
          else
            return parseInt(val);
        }
          
        buildTo.add(drink, getNumeric("buildTo", values[site.buildTableOffset + this.buildToOffset]));
        inFridge.add(drink, getNumeric("inFridge", values[site.buildTableOffset + this.inFridgeOffset]));
        dead.add(drink, getNumeric("dead", values[site.buildTableOffset + this.deadOffset]));
      }
      var build = new SiteBuild(today, site, this.buildId, buildTo, inFridge, dead);
      summary.addBuild(build);
    }
    
    return summary;
    */
  },
  
/*
 * setNewtargets: update the build table sheet to reflect the new targets we now have
 * @param {Object} targets - A DrinksSummary object containing counts of all drinks accross all sites
 */
  setNewTargets: function(siteNames, drinkTypes, targets)
  {
    var si, dti, site, drinkName, drinks;
    
    Logger.log("<<< Setting New Build Sheet targets for buildId " + this.buildId);
    Logger.log(targets.toString());
    
    for (var si=0; si<siteNames.length; si++) {
      site = new Site(siteNames, si);
      for (var dti=0; dti<drinkTypes.length; dti++) {
        drinkName = drinkTypes[dti];
        if (targets.site[si] && targets.site[si].drinks.count[drinkName]) {
          drinks=targets.site[si].drinks;
          if (BU.isNumber(drinks.count[drinkName])) {
            var range = this.buildSheet.getRangeByName(this.sheetNamePrefix + drinkName);
            ASSERT_TRUE(range!=null, "Range '" + this.sheetNamePrefix + drinkName + "' not found in buildId " + this.buildId + " with Id '" + this.sheetId + "'");
            var row=range.getValues();
            row[0][site.buildTableOffset + this.buildToOffset] = drinks.count[drinkName];
            range.setValues(row);
          }
          else {
            Logger.log('BuildTable.setNewTarets (%s.%s) - value is non numeric, skipping', siteNames[si], drinkName);
          }
        }
        else {
          Logger.log('BuildTable.setNewTargets, no data present for (%s.%s), skipping', siteNames[si], drinkName);
        }
      }
    }
    Logger.log("--- New targets set, ready to roll");
    
  }
}