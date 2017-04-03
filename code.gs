/*
 * Automatic event entry point to log the build, generate new targets, 
 * sync them with the preview table and then push them to the Build Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function logMondayBuild(fileIds)
{
  var config = getConfig(fileIds.tracker);
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  
  logBuild(1);
  generateTargets(2);
  if (config.pushTargets == "y")
    pushTargets(2);
}

/*
 * Automatic event entry point to log the build, generate new targets, 
 * sync them with the preview table and then push them to the Build Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function logThursdayBuild(fileIds)
{
  var config = getConfig(fileIds.tracker);
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  
  logBuild(2, fileIds);
  generateTargets(1, fileIds);
  if (config.pushTargets == "y")
    pushTargets(1, fileIds);

}

/*
 * Spreadsheet Menu entry poiont for manually generating targets to the Build Preview Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function generateMondayTargets(fileIds) {
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  generateTargets(1, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually generating targets to the Build Preview Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function generateThursdayTargets(fileIds) {
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  generateTargets(2, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually pushing the Build Preview targets to the production build Sheet
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function pushMondayTargets(fileIds) {
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  pushTargets(1, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually pushing the Build Preview targets to the production build Sheet
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function pushThursdayTargets(fileIds) {
  Logger = BetterLog.useSpreadsheet("112Zh2DFjJVbwMeRmUzc7osv6B_ZY4GKeKU5NKc80owc");
  pushTargets(2, fileIds);
}

/*
 * logBuild - log a Build Table Sheet to the history tables
 * @param {int} buildId - the build Id (buid sheet) of the build we are logging
 * @param {Object} fileIds - Spreadsheet file Ids to work on
 */
function logBuild(buildId, fileIds)
{
  ASSERT_TRUE(typeof buildId == "number");
  
  var trackerId = fileIds.tracker;
  var buildSheetId = buildId==1 ? fileIds.mondayBuild : fileIds.thursdayBuild;
  var config = getConfig(trackerId);
  //var sites = new Sites(config.sites);
  var buildTable = new BuildTable(buildId, fileIds);
  
  var summary = buildTable.getBuildSummary(config.sites, config.drinkTypes);
  
  // Have the current build summary, now need to calculate the 'sold' values
  var history = new BuildHistory(fileIds);
  var totals = new BuildHistoryTotals(fileIds);
  
  var prevSummary = history.getBuildSummary(config.sites, config.drinkTypes, summary.buildId == 1 ? 2 : 1);
  
  var sold;
  var prevBuild;
  var curBuild;
  
  for (var si=0; si< prevSummary.site.length; si++) {
    prevBuild = prevSummary.site[si];
    curBuild = summary.site[si];
    sold = new IcedDrinks(config.drinkTypes);
    if (curBuild != null) {
      // Calculate the sold values for all the drinks
      // Sold = previous buildTo - current inFridge - current dead (expired) drinks
      for (var dti=0; dti < sold.drinkTypes.length; dti++) {
        var drink = sold.drinkTypes[dti];
        var soldCount = prevBuild.buildTo.count[drink] - curBuild.inFridge.count[drink] - curBuild.dead.count[drink];
        sold.add(drink, soldCount > 0 ? soldCount : 0);
      }
    }
    curBuild.sold = sold;
  }
    
  history.appendBuildSummary(summary);
  totals.appendBuildTotals(summary);
  
  SpreadsheetApp.flush();
}

/*
 * Work out a new set of build targets (buildTo) for the given buildId
 *  - Populate a new BuildSummary object with the target buildTo numbers
 *  - Sync new target values to Preview Sheet
 *
 * Basic algorithm averages number sold from previous builds, applies a scaling factor
 * and then optionally bumps up the individual drink amounts if they have run out
 *
 * Other alogrithms have been available in the past but are currently deprecated:
 *  - percentPrevBuild: Next build is a precentage of the diff between previous build
 *                      and what's in the fridge
 * generatetargets
 * @param {int} buildId - the build Id (buid sheet) of the build we are logging
 * @param {Object} fileIds - Spreadsheet filesIds being used
 */
function generateTargets(buildId, fileIds) 
{
  ASSERT_TRUE(typeof buildId == "number" && (buildId == 1 || buildId == 2), "generateTargets: buildId must be either 1 or 2");
  
  var config = getConfig(fileIds.tracker);
    
  var workingBuildId = buildId == 1 ? 2 : 1; // Sold data for this buildId are on the opposite buildId's rows
  
  var history = new BuildHistory(fileIds);  // Grab the previous 'n' build histories of the other build
  var soldHistory = history.getBuildSummaries(config.sites, config.drinkTypes, workingBuildId, config.nWeeks);
  var lastSnapshot = soldHistory[0]; // the last snapshot is always the most recent snapshot of the other build
  
  Logger.log("==== generateTargets(buildId: " + buildId + ") ====");
  Logger.log("=> History over " + config.nWeeks + " weeks");
  for (var i=0; i<soldHistory.length; i++) {
    Logger.log("=> history[" + i + "]:");
    Logger.log(soldHistory[i].toString());
  }
  Logger.log("=> Last Snapshot for buildId " + buildId + ":");
  Logger.log(lastSnapshot.toString());
  
  
  // get averaged sold amounts from build history
  var targets = getAverageSold(config.sites, config.drinkTypes, soldHistory, config.includeDeadInSold == "y" ? true : false);
  
  Logger.log("=== Sold Aggregate ===");
  Logger.log(targets.toString());
  
  // apply configured adjustment based on config and build sheet being calculated
  var ADJ_FACTOR = buildId==1 ? config.monFactor : config.thuFactor;
  var ZERO_BUMP_UP = typeof config.zeroBumpUp != "undefined" ? config.zeroBumpUp : 0;
  
  Logger.log(ZERO_BUMP_UP > 0 ? "  ZERO_BUMP_UP is " + ZERO_BUMP_UP + " - applying algorithm" : "  ZERO_BUMP_UP not set, no bumps y'all");
  
  for (var siteNum = 0; siteNum < targets.numSites; siteNum++) {
    //targets.site[siteNum].drinks.applyCoefficient(1/(soldHistory.length+1));
    targets.site[siteNum].drinks.applyCoefficient(ADJ_FACTOR, true);
    if (ZERO_BUMP_UP>0) {
      var inFridgeNow = lastSnapshot.site[siteNum].inFridge;
      for (var dti=0; dti<inFridgeNow.drinkTypes.length; dti++) {
        var drink = inFridgeNow.drinkTypes[dti];
        if (inFridgeNow.count[drink] == 0) {
          Logger.log("  " + targets.siteNames[siteNum] + " has 0 [" + drink + "]s in fridge, BUMPING UP");
          if (targets.site[siteNum].drinks.count.hasOwnProperty(drink))
            targets.site[siteNum].drinks.add(drink, ZERO_BUMP_UP);
          else
            Loggser.log("  Cancelling BUMP UP for " + targets.siteNames[siteNum] + ": " + drink + " as is not in configured drinkTypes");
        }
      }
    }
  }
  
  // Now we have new build targets for all the sites, push them to the build preview
  var preview = new BuildPreview(fileIds);
  preview.setNewTargets(buildId, targets);
  
}

/*
 * getAverageSold - helper function for generateTargets
 *   - was also used by a deprecated algorithm so code was shared but no longer
 * @param {string[]} siteNames - the configured sites we are working with
 * @param {string[]} drinkTypes - the configured drink types we are working with
 * @param {Object[]} soldHistory - an array of BuildSummary objects representing the build summaries we are working with
 * @param {boolean} INCLUDE_DEAD - weather or not to include the wastage drinks in the sold count for averaging
 * @returns {Object} - a DrinksSummary object with the averaged values accross the configured sites
 */
function getAverageSold(siteNames, drinkTypes, soldHistory, INCLUDE_DEAD)
{
  var avgSold = new DrinksSummary(new Date(), siteNames, drinkTypes);
  // aggregate the sold numbers accross all the configured weeks
  for (var sumi = 0; sumi < soldHistory.length; sumi++) {
    var numSites = soldHistory[sumi].site.length;
    for (var siteNum = 0; siteNum < numSites; siteNum++) {
      var prevSold = soldHistory[sumi].site[siteNum].sold;
      var prevDead = soldHistory[sumi].site[siteNum].dead
      avgSold.site[siteNum].drinks.aggregate(prevSold);
      if (INCLUDE_DEAD)  // #sold is already adjusted back by the dead amounts. Ignore this (if configured) by addibng it back in
        avgSold.site[siteNum].drinks.aggregate(prevDead);
    }
  }
  var numBuilds = soldHistory.length;
  for (siteNum=0; siteNum < siteNames.length; siteNum++) {
    avgSold.site[siteNum].drinks.applyCoefficient(1/numBuilds);
  }

  return avgSold;
}

/*
 * pushTargets - push targets from Build Preview to the production Build table sheets
 * @param {int} buildId - the build Id (buid sheet) we are pushing to
 * @param {Object} fileIds - Spreadsheet files Ids being used
 */
function pushTargets(buildId, fileIds) {
  var config = getConfig(fileIds.tracker);
  
  var preview = new BuildPreview(fileIds);
  var targets = preview.getNewTargets(buildId, config.sites, config.drinkTypes);
  
  var table = new BuildTable(buildId, fileIds);
  table.setNewTargets(targets);
}

/*
 * Add a convenience function to Date objects so that we can cleanly insert them into tables
 * @returns {string} - a string of the format DD/MM/YYYY
 */
Date.prototype.toOzyDateString = function() {
  var zeroPad=function(n) { if (n<10) return "0" + n; else return n; }
  return zeroPad(this.getDate()) + "/" + zeroPad(this.getMonth()+1) + "/" + this.getFullYear();
}

