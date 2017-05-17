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
  Logger.log("[LB] <<< Logging new build for buildId %s >>>", buildId);
  
  var config = getConfig(fileIds.tracker);
  var trackerId = fileIds.tracker;
  var buildSheetId = buildId==1 ? fileIds.mondayBuild : fileIds.thursdayBuild;
  var config = getConfig(trackerId);
  //var sites = new Sites(config.sites);
  var buildTable = new BuildTable(buildId, fileIds);
  
  Logger.log("[LB] --- Getting build summary from build spreadsheet (buildId: %s, %s, %s) >>>", buildId, config.sites, config.drinkTypes);
  var summary = buildTable.getBuildSummary(config.sites, config.drinkTypes);
  Logger.log("[LB] --- Build spreadsheet snapshot:\n%s", summary.toString());
  
  // Have the current build summary, now need to calculate the 'sold' values
  var history = new BuildHistory(fileIds);
  var totals = new BuildHistoryTotals(fileIds);
  
  var prevBuildId = summary.buildId == 1 ? 2 : 1;
  Logger.log("[LB] --- Getting previous build from logs to calculate sold values (buildId: %s, %s, %s) >>>", prevBuildId, config.sites, config.drinkTypes);
  var prevSummary = history.getBuildSummary(config.sites, config.drinkTypes, prevBuildId);
  Logger.log("[LB] --- Previous logged build:\n%s", prevSummary.toString());
  
  var sold;
  var prevBuild;
  var curBuild;
  
  for (var si=0; si< summary.site.length; si++) {
    prevBuild = prevSummary.site[si];
    curBuild = summary.site[si];
    sold = new IcedDrinks(config.drinkTypes);
    // if we have buid data for this site on both builds, calculate the sold values
    if (curBuild && prevBuild) {
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
        /*
        else { // new drink, generate a sold value so that new build stays stationary
          sold.add(drink, Math.round(curBuild.buildTo.count[drink] / config.buildFactor(buildId==1?2:1)));
        }
        */
      }
    }
    curBuild.sold = sold;
  }
  
  Logger.log("[LB] --- Appending logs for the following summary:\n%s", summary.toString());
  
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
  
  Logger.log("<<< Generating new build targets for buildId %s using %s weeks of data >>>", buildId, config.nWeeks);
  
  for (var i=0; i<soldHistory.summaries.length; i++) {
    Logger.log("--- Build History week %s:", i);
    Logger.log(soldHistory.summaries[i].toString());
  }
  
  var soldDrinksAggregator = function(config, buildId, siteNum, drink, numWeeks, soldAmounts, inFridgeNow, buildToNow) {
    var averageSold;
    var newBuildNum;
    var buildFactor = config.buildFactor(buildId===1?2:1); // generating targets for next buid, not this one
    var logMessage = "  => soldDrinksAggregator(bId:" + buildId + ", site:" + siteNum + ", " + drink + ", [" + soldAmounts + "], ifn:" + inFridgeNow + ")";
    
    if (soldAmounts.length == 0 || (config.newDrinkBehavior == "buildTableOverride" && numWeeks != soldAmounts.length)) {
      Logger.log("  SoldDrinksAggregator: Found new drink '" + drink + "' for " + config.sites[siteNum] + " - not generating new target (using null)");
      newBuildNum = null;
    }
    else {
      if (numWeeks != soldAmounts.length)
        Logger.log("  SoldDrinksAggregator: Found new drink '" + drink + "' for " + config.sites[siteNum] + " - using limited sold averaging (" + soldAmounts.length + " weeks rather than " + numWeeks + ")");
      averageSold = soldAmounts.reduce(function(a, b) { return a + b; }, 0) / soldAmounts.length;
      newBuildNum = Math.round(averageSold * buildFactor);
      logMessage += " => " + (Math.round(averageSold*100)/100) + " * " + buildFactor + " = " + newBuildNum;
      
      if (config.zeroBumpUp && inFridgeNow == 0) {
        newBuildNum += parseInt(config.zeroBumpUp);
        logMessage += " + " + config.zeroBumpUp + " BUMP UP = " + newBuildNum;
      }
    }
    Logger.log(logMessage);
    return newBuildNum;
  }
  
  
  // get averaged sold amounts from build history
  var targets = soldHistory.generateSoldSummary(config, soldDrinksAggregator);
  
  Logger.log("--- New Targets generated:");
  Logger.log(targets.toString());
  
  // Now we have new build targets for all the sites, push them to the build preview
  var preview = new BuildPreview(config, fileIds);
  preview.setNewTargets(buildId, targets);
  
  // grab the last build done for this same buildId to update the prev fields
  var prevBuild = history.getBuildSummary(config.sites, config.drinkTypes, buildId);
  preview.setPrevTargets(buildId, prevBuild.getBuildToSummary(config.drinkTypes));  
  
  Logger.log("--- Finished New Target generation ---");
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
  
  var preview = new BuildPreview(config, fileIds);
  var targets = preview.getNewTargets(buildId);
  
  var table = new BuildTable(buildId, fileIds);
  table.setNewTargets(config.sites, config.drinkTypes, targets);
}

