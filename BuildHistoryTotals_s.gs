/*
 * CONSTRUCTOR object accessor allowing operations on the Build History Totals table
 * Build History Totals is a summary table showing the overall performance of the sites
 * @constructor
 * @param {Object} optFileIds - (returned by getFileIds) optionally override the files used for IcedDrinks access
 */
function BuildHistoryTotals(optFileIds) {
  var fileIds = typeof optFileIds == "undefined" ? fileIds = getFileIds() : optFileIds;
  var sheetId = fileIds.tracker;
  this.ssTracker = SpreadsheetApp.openById(sheetId);
  ASSERT_TRUE(this.ssTracker != null, "No tracker spreadsheet found with id '" + sheetId + "'");
  this.totalsSheet = this.ssTracker.getSheetByName("Build History Totals");
  ASSERT_TRUE(this.totalsSheet != null, "No sheet 'Build History Totals' found in Tracker spreadsheet");
  
}

/*
 * Append a buildSumamry to the History Totals Table
 * @param {Object} summary - the BuidSummary object to use to populate the table
 */
BuildHistoryTotals.prototype.appendBuildTotals = function(summary) {
  ASSERT_TRUE(typeof this.totalsSheet != "undefined" && this.totalsSheet != null, "BuildHistory.appendBuildSumary - invalid historySheet value");
  for (var si=0; si<summary.site.length; si++) {
    var build = summary.site[si];
    var row;
    var date = build.date;
    var buildId = build.buildId;
    var siteName = build.site.name;
    var dateString = 
    row = [];
    row[row.length] = date.toOzyDateString();
    row[row.length] = date.getDay();
    row[row.length] = buildId;
    row[row.length] = 0;
    row[row.length] = siteName;
    row[row.length] = summary.making;
    row[row.length] = build.making;
    row[row.length] = build.buildTo != null ? build.buildTo.total : -1;
    row[row.length] = build.inFridge != null ? build.inFridge.total : -1;
    row[row.length] = build.dead != null ? build.dead.total : -1;
    row[row.length] = build.sold != null ? build.sold.total : -1;
    this.totalsSheet.appendRow(row);
  }
}


