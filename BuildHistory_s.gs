/*
 * CONSTRUCTOR object accessor allowing operations on the Build History table
 * Build History is the history of previous builds and allows us to go back and look
 * at our trends to modify current or future builds
 * @constructor
 * @param {Object} fileIds - SpreadSheet Ids to be used for access
 */
function BuildHistory(fileIds) {
  this.sheetId = fileIds.tracker;

  this.ssTracker = SpreadsheetApp.openById(this.sheetId);
  this.historySheet = this.ssTracker.getSheetByName("Build History");
  ASSERT_TRUE(this.historySheet != null, "No sheet 'Build History' found in Tracker spreadsheet");
}

BuildHistory.prototype = {
  /*
   * Get latest build summary with specified buildId from the Build History
   * @param {string[]} siteNames - the list of configured site names we are working with
   * @param {string[]} drinkTypes - the list of configured drink types we are working with
   * @param {int} buildId - the build Id of this summary (indicates the build sheet)
   * @returns {Object} - a BuildSummary object representing the last Iced Drinks build 
   */
  getBuildSummary: function(siteNames, drinkTypes, buildId) {
    return this.getBuildSummaries(siteNames, drinkTypes, buildId, 1)[0];
  },

  /*
   * Get a sequence of build summaries from a specific build day (buildId)
   * @param {string[]} siteNames - the list of configured site names we are working with
   * @param {string[]} drinkTypes - the list of configured drink types we are working with
   * @param {int} buildId - the build Id of this summary (indicates the build sheet)
   * @returns {Object} - a BuildSummaryEvents object holding a history sequence
   */
  getBuildSummarySequence: function (siteNames, drinkTypes, buildId, numSummaries) {
    return new BuildSummarySequence(siteNames, drinkTypes, buildId, this.getBuildSummaries(siteNames, drinkTypes, buildId, numSummaries));
  buildId, siteNames, drinkTypes, buildSummaries
  },
  
  /*
   * Get latest numSummaries build summaries with specified buildId from the Build History
   * @param {string[]} siteNames - the list of configured site names we are working with
   * @param {string[]} drinkTypes - the list of configured drink types we are working with
   * @param {int} buildId - the build Id of this summary (indicates the build sheet)
   * @param {int} numSummaries - the number of summaries to construct of this build Id from the history table
   * @returns {Object[]} - a BuildSummary[]  representing the last 'numSummaries' Iced Drinks builds
   */
  getBuildSummaries: function(siteNames, drinkTypes, buildId, numSummaries) {
    var summaries = [];
    var buildRowDepth = (siteNames.length + 1) * (drinkTypes.length + 3); // allow for 1 extra site and 3 extra drinks (that have been removed)
    var rowDepth =  buildRowDepth * (numSummaries * 2 + 1);  // allow for executing out of phase when we have one extra summary in the history we don't need
    var startRow = this.historySheet.getLastRow() - rowDepth + 1;
    var numCols = this.historySheet.getLastColumn();
    var range = this.historySheet.getRange(startRow, 1, rowDepth, numCols);
    //var sites = new Sites(siteNames);
    ASSERT_TRUE(range!=null, "BuildHistory.getPrevBuildSummaries: Unable to get history range");
    
    var build;
    var buildTo;
    var inFridge;
    var dead;
    var sold;
    var rowDate;
    var summary;
    var summaryData;
    var siteBuildData;
    
    Logger.log("==> BuildHistory.getBuildSummaries(buildId: " + buildId + ", numSummaries:" + numSummaries);
    Logger.log("  - #sites:" + siteNames.length + " + #drinkTypes:" + drinkTypes.length + " + nWeeks:" + numSummaries + " = " + siteNames.length * drinkTypes.length + " rows per build");
    Logger.log("  - grabbing " + rowDepth + " rows from Build History table");

    var history = range.getValues();
    var f_history = ArrayLib.filterByText(history, 2, buildId.toString());
    var buildDate = null;
    
    Logger.log("  - filter by buildId: " + buildId + " yields " + f_history.length + " rows");
    
    // Scan backwards for date changes (including the first one) and use that to subset the rows and create a BuildSummary
    for (var row=f_history.length-1; row >=0; row--) {
      rowDate = new Date(f_history[row][0]);
      if (buildDate == null || rowDate.getTime() != buildDate.getTime()) {
        // found a new date, create a BuildSummary
        Logger.log("  Found new date: " + rowDate + " creating a BuildSummary");
        summaryData = ArrayLib.filterByDate(f_history, 0, new Date(rowDate.getTime()-1), new Date(rowDate.getTime()+1));
        Logger.log("  Filter by date on f_history gives " + summaryData.length + " rows");
        
        summary = new BuildSummary(rowDate, siteNames, buildId);
        buildDate=new Date(rowDate.getTime());

        for (var si=0; si<siteNames.length; si++) {
          siteBuildData = ArrayLib.filterByText(summaryData, 4, siteNames[si]);
          Logger.log(" --Filter by '%s' gives %s rows", siteNames[si], siteBuildData.length);
          
          if (siteBuildData.length > 0) {
            buildTo = new IcedDrinks(drinkTypes);
            inFridge = new IcedDrinks(drinkTypes);
            dead = new IcedDrinks(drinkTypes);
            sold = new IcedDrinks(drinkTypes);
            for (var i=0; i<siteBuildData.length; i++) {
              var drink = siteBuildData[i][5];
              buildTo.add(drink, parseInt(siteBuildData[i][6]));
              inFridge.add(drink, parseInt(siteBuildData[i][7]));
              dead.add(drink, parseInt(siteBuildData[i][8]));
              sold.add(drink, parseInt(siteBuildData[i][9]));
            }
            build = new SiteBuild(buildDate, new Site(siteNames,si), buildId, buildTo, inFridge, dead, sold);
            summary.addBuild(build);
          }
        }
        summaries[summaries.length] = summary;
      
        if (summaries.length == numSummaries)
          break;
      }
    }
    
    return summaries;
  },

  /*
   * Append a build Sumamry to the History Table
   * @param {Object} summary - a BuildSummary object that needs to be appended to the BuildHistory table
   */
  appendBuildSummary: function(summary) {
    ASSERT_TRUE(typeof this.historySheet != "undefined" && this.historySheet != null, "BuildHistory.appendBuildSumary - invalid historySheet value");
    for (var si=0; si<summary.site.length; si++) {
      var build = summary.site[si];
      var row = [];
      var drinkTypes = build.buildTo.drinkTypes;
      var date = build.date;
      var buildId = build.buildId;
      var siteName = build.site.name;
      for (var dti=0; dti<drinkTypes.length; dti++) {
        var drink = drinkTypes[dti];
        row = [];
        row[row.length] = date.toOzyDateString();
        row[row.length] = date.getDay();
        row[row.length] = buildId;
        row[row.length] = 0;
        row[row.length] = siteName;
        row[row.length] = drink;
        row[row.length] = build.buildTo != null ? build.buildTo.count[drink] : -1;
        row[row.length] = build.inFridge != null ? build.inFridge.count[drink] : -1;
        row[row.length] = build.dead != null ? build.dead.count[drink] : -1;
        row[row.length] = build.sold != null ? build.sold.count[drink] : -1;
        this.historySheet.appendRow(row);
      }
    }
  }
}
  
