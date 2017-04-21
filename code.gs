function buildTrigger(buildId, fileIds)
{
  ASSERT_TRUE(typeof buildId == "number", "buildTrigger: invalid buildId");
  ASSERT_TRUE(typeof fileIds !== "undefined", "buildTrigger: undefined fileIds");

  var logBuildId = buildId;
  var nextBuildId = buildId == 1 ? 2 : 1;
  
  var config = getConfig(fileIds.tracker);
  if (fileIds.log) {
    Logger = BetterLog.useSpreadsheet(fileIds.log);
    Logger.log("\n\n----------> build trigger start, buildId:" + buildId + " <----------")
  }
  logBuild(logBuildId, fileIds);
  generateTargets(nextBuildId, fileIds);
  if (config.pushTargets == "y")
    pushTargets(nextBuildId, fileIds);
}

/*
 * Automatic event entry point to log the build, generate new targets, 
 * sync them with the preview table and then push them to the Build Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function mondayBuildTrigger(fileIds)
{
  ASSERT_TRUE(typeof fileIds !== "undefined", "mondayBuildTrigger: undefined fileIds");
  buildTrigger(1, fileIds);
}

/*
 * Automatic event entry point to log the build, generate new targets, 
 * sync them with the preview table and then push them to the Build Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function thursdayBuildTrigger(fileIds)
{
  ASSERT_TRUE(typeof fileIds !== "undefined", "thursdayBuildTrigger: undefined fileIds");
  buildTrigger(2, fileIds);
}

/*
 * Menu entry point to manually log a build
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function logMondayBuild(fileIds)
{
  ASSERT_TRUE(typeof fileIds !== "undefined", "logMondayBuild: undefined fileIds");
  logBuild(1, fileIds);
}

/*
 * Menu entry point to manually log a build
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function logThursdayBuild(fileIds)
{
  ASSERT_TRUE(typeof fileIds !== "undefined", "logThursdayBuild: undefined fileIds");
  logBuild(2, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually generating targets to the Build Preview Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function generateMondayTargets(fileIds) {
  ASSERT_TRUE(typeof fileIds !== "undefined", "generateMondayTargets: undefined fileIds");
  if (fileIds.log)    
    Logger = BetterLog.useSpreadsheet(fileIds.log);
  generateTargets(1, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually generating targets to the Build Preview Table
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function generateThursdayTargets(fileIds) {
  ASSERT_TRUE(typeof fileIds !== "undefined", "generateThursdayTargets: undefined fileIds");
  if (fileIds.log) 
    Logger = BetterLog.useSpreadsheet(fileIds.log);
  //generateTargets(2, fileIds);
  generateTargets(2, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually pushing the Build Preview targets to the production build Sheet
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function pushMondayTargets(fileIds) {
  ASSERT_TRUE(typeof fileIds !== "undefined", "pushMondayTargets: undefined fileIds");
  if (fileIds.log)     
    Logger = BetterLog.useSpreadsheet(fileIds.log);
  pushTargets(1, fileIds);
}

/*
 * Spreadsheet Menu entry poiont for manually pushing the Build Preview targets to the production build Sheet
 * @param {Object} fileIds - an object containing the Spreadsheet file Ids being worked on
 */
function pushThursdayTargets(fileIds) {
  ASSERT_TRUE(typeof fileIds !== "undefined", "pushThursdayTargets: undefined fileIds");
  if (fileIds.log)     
    Logger = BetterLog.useSpreadsheet(fileIds.log);
  pushTargets(2, fileIds);
}

/*
 * logBuild - log a Build Table Sheet to the history tables
 * @param {int} buildId - the build Id (buid sheet) of the build we are logging
 * @param {Object} fileIds - Spreadsheet file Ids to work on
 */
function logBuild(buildId, fileIds)
{
  ASSERT_TRUE(typeof buildId == "number", "logBuild: invalid buildId");
  ASSERT_TRUE(typeof fileIds !== "undefined", "logBuild: undefined fileIds");
  
  var config = getConfig(fileIds.tracker);
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
        // calculating sold for all currently configured drinks, check if there is a new one
        if (prevBuild.buildTo.count[drink]) {
          // Take highest of the buildTo of that day or what was already in fridge
          var numDrinksLastBuild = prevBuild.buildTo.count[drink] > prevBuild.inFridge.count[drink] ? prevBuild.buildTo.count[drink] : prevBuild.inFridge.count[drink];
          var soldCount = numDrinksLastBuild - curBuild.inFridge.count[drink] - curBuild.dead.count[drink];
          sold.add(drink, soldCount > 0 ? soldCount : 0);
        }
        else { // new drink, generate a sold value so that new build stays stationary
          sold.add(drink, curBuild.buildTo[drink].count / config.buildFactor(buildId==1?2:1));
        }
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
  ASSERT_TRUE(typeof fileIds !== "undefined", "generateTargets: undefined fileIds");
  
  var config = getConfig(fileIds.tracker);
  
  var BUILD_TO_OVERRIDE = config.buildToOverride == 'y' ? true : false;
  var workingBuildId = buildId == 1 ? 2 : 1; // Sold data for this buildId are on the opposite buildId's rows
  
  var history = new BuildHistory(fileIds);  // Grab the previous 'n' build histories of the other build
  var soldHistory = history.getBuildSummarySequence(config.sites, config.drinkTypes, workingBuildId, config.nWeeks);
  
  Logger.log("==== generateTargets(buildId: " + buildId + ") ====");
  Logger.log("=> History over " + config.nWeeks + " weeks");
  for (var i=0; i<soldHistory.summaries.length; i++) {
    Logger.log("=> history[" + i + "]:");
    Logger.log(soldHistory.summaries[i].toString());
  }
  
  var soldDrinksAggregator = function(config, buildId, siteNum, drink, numWeeks, soldAmounts, inFridgeNow) {
    var averageSold;
    var newBuildNum;
    Logger.log("  => soldDrinksAggregator(bId:" + buildId + ", site:" + siteNum + ", " + drink + ", [" + soldAmounts + "], ifn:" + inFridgeNow + ")");
    if (soldAmounts.length == 0 || (config.newDrinkBehavior == "buildTableOverride" && numWeeks != soldAmounts.length)) {
      Logger.log("  Found new drink '" + drink + "' for " + config.sites[siteNum] + " - not generating new target (using null)");
      newBuildNum = null;
    }
    else {
      if (numWeeks != soldAmounts.length)
        Logger.log("  Found new drink '" + drink + "' for " + config.sites[siteNum] + " - using limited sold averaging (" + soldAmounts.length + " weeks rather than " + numWeeks + ")");
      averageSold = soldAmounts.reduce(function(a, b) { return a + b; }, 0) / soldAmounts.length;
      newBuildNum = Math.round(averageSold * config.buildFactor(buildId));
      if (config.zeroBumpUp && inFridgeNow == 0) {
        Logger.log("  - 0 in fridge, BUMPING UP by %s", config.zeroBumpUp);
        newBuildNum += parseInt(config.zeroBumpUp);
      }
    }
    return newBuildNum;
  }
  
  
  // get averaged sold amounts from build history
  var targets = soldHistory.generateSoldSummary(config, soldDrinksAggregator);
  
  Logger.log("=== New Targets ===");
  Logger.log(targets.toString());
  
  // Now we have new build targets for all the sites, push them to the build preview
  var preview = new BuildPreview(fileIds);
  preview.setNewTargets(buildId, targets);
  
  // grab the last build done for this same buildId to update the prev fields
  var prevBuild = history.getBuildSummary(config.sites, config.drinkTypes, buildId);
  preview.setPrevTargets(buildId, prevBuild.getBuildToSummary(config.drinkTypes));  
}

/*
 * Old GenerateTargets - deprecated
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
function _deprecatedGenerateTargets(buildId, fileIds) 
{
  ASSERT_TRUE(typeof buildId == "number" && (buildId == 1 || buildId == 2), "generateTargets: buildId must be either 1 or 2");
  ASSERT_TRUE(typeof fileIds !== "undefined", "generateTargets: undefined fileIds");
  
  var config = getConfig(fileIds.tracker);
  
  var BUILD_TO_OVERRIDE = config.buildToOverride == 'y' ? true : false;
  var workingBuildId = buildId == 1 ? 2 : 1; // Sold data for this buildId are on the opposite buildId's rows
  
  var history = new BuildHistory(fileIds);  // Grab the previous 'n' build histories of the other build
  var soldHistory = history.getBuildSummaries(config.sites, config.drinkTypes, workingBuildId, config.nWeeks);
  var lastSnapshot = soldHistory[0]; // the last snapshot is always the most recent snapshot of the other build
  var prevSameBuild = history.getBuildSummary(config.sites, config.drinkTypes, buildId);
  
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
    //if (ZERO_BUMP_UP>0) {
    var inFridgeNow = lastSnapshot.site[siteNum].inFridge;
    var prevSameBuildTo = prevSameBuild.site[siteNum].buildTo;

    for (var dti=0; dti<inFridgeNow.drinkTypes.length; dti++) {
      var drink = inFridgeNow.drinkTypes[dti];
      var isNewDrink = false;
      // check if this is a new drink and if the prevous builds would not have sold values
      for (var pbi=1; pbi < soldHistory.length; pbi++) {
        if (soldHistory[pbi].site[siteNum].buildTo.count[drink] == 0) {
          isNewDrink = true;
          break;
        }
      }
      if (isNewDrink || BUILD_TO_OVERRIDE) { 
        // if this is a new drink for this site, use the current buildTo
        targets.site[siteNum].drinks.set(drink, prevSameBuildTo.count[drink]);
        Logger.log("  Found new drink '" + drink + "' for " + config.sites[siteNum] + " - just using current buildTo:" + prevSameBuildTo.count[drink]);
      }
      else if (inFridgeNow.count[drink] == 0) {
        Logger.log("  " + targets.siteNames[siteNum] + " has 0 [" + drink + "]s in fridge, BUMPING UP");
        if (targets.site[siteNum].drinks.count.hasOwnProperty(drink))
          targets.site[siteNum].drinks.add(drink, ZERO_BUMP_UP);
        else
          Loggser.log("  Cancelling BUMP UP for " + targets.siteNames[siteNum] + ": " + drink + " as is not in configured drinkTypes");
      }
      //}
    }
  }
  
  // Now we have new build targets for all the sites, push them to the build preview
  var preview = new BuildPreview(fileIds);
  preview.setNewTargets(buildId, targets);
  
  // grab the last build done for this same buildId to update the prev fields
  var prevBuild = history.getBuildSummary(config.sites, config.drinkTypes, buildId);
  preview.setPrevTargets(buildId, prevBuild.getBuildToSummary(config.drinkTypes));
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
function _deprecatedGetAverageSold(siteNames, drinkTypes, soldHistory, INCLUDE_DEAD)
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
    avgSold.site[siteNum].drinks.applyCoefficient(1/(soldHistory.length < numBuilds ? soldHistory.length : numBuilds));
  }

  return avgSold;
}

/*
 * pushTargets - push targets from Build Preview to the production Build table sheets
 * @param {int} buildId - the build Id (buid sheet) we are pushing to
 * @param {Object} fileIds - Spreadsheet files Ids being used
 */
function pushTargets(buildId, fileIds) {
  ASSERT_TRUE(typeof buildId == "number" && (buildId == 1 || buildId == 2), "pushTargets: buildId must be either 1 or 2");
  ASSERT_TRUE(typeof fileIds !== "undefined", "pushTargets: undefined fileIds");

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

