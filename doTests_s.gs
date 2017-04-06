

function tDrinksExpected(drinks, expected) {
  if (drinks == null)
    return false;
  else {
    var id;
    for (id in expected) {
      if (drinks[id] != expected[id])
        return false;
    }
  }
  return true;
}

function tBuildPreview(config, fileIds) {
  var drinkTypes = config["drinkTypes"];
  var bp = new BuildPreview(fileIds);
  //var bunker = new Site(config, "bunker");
  //var jmh = new
  var expected = [{soy: 58,fc: 114,fcTriple:54,light:33,darkChoc:22,darkMocha:20,darkSoyChoc:null,dairyChoc:26,dairyChocFlav:null},
                  {soy: 33,fc: 39,fcTriple:75,light:26,darkChoc:10,darkMocha:11,darkSoyChoc:null,dairyChoc:15,dairyChocFlav:null},
                  {soy: 63,fc: 137,fcTriple:42,light:40,darkChoc:29,darkMocha:28,darkSoyChoc:null,dairyChoc:36,dairyChocFlav:null},
                  {soy: 29,fc: 41,fcTriple:66,light:24,darkChoc:15,darkMocha:15,darkSoyChoc:null,dairyChoc:11,dairyChocFlav:null}];
  
  var testNum = 0;
  var siteNames = config.sites;
  var days = [1,4];
  for (var di=0; di < days.length; di++) {
    var day = days[di];
    
    for (var siteNum=0; siteNum < siteNames.length; siteNum++) {
      var siteName = siteNames[siteNum];
      var site = new Site(siteNames, siteNum);
      var newDrinks = bp.getNewTargets(site, day, drinkTypes);
      Logger.log("-------- " + siteName + ": day " + day + " --------");
      ASSERT_TRUE(tDrinksExpected(newDrinks.count, expected[testNum]), "TEST FAILED: BP - site: " + site.name + ", day=" + day);
      Logger.log("-------- Succeeded --------");
      Logger.log(newDrinks);
      
      testNum++;
    }
  }
  return true;
}

function tBuildTable(config, fileIds)
{
  var e_buildTo = [{soy: 62,fc: 129,fcTriple:37,light:33,darkChoc:29,darkMocha:27,dairyChoc:41},
                   {soy: 34,fc: 36,fcTriple:59,light:21,darkChoc:10,darkMocha:15,dairyChoc:10}];
  var e_inFridge = [{soy: 38,fc: 67,fcTriple:22,light:4,darkChoc:15,darkMocha:9,dairyChoc:25},
                    {soy: 9,fc: 24,fcTriple:23,light:12,darkChoc:12,darkMocha:9,dairyChoc:0}];
  var e_dead = [{soy: 0,fc: 0,fcTriple:0,light:0,darkChoc:0,darkMocha:0,dairyChoc:0},
                {soy: 0,fc: 0,fcTriple:0,light:0,darkChoc:0,darkMocha:0,dairyChoc:0}];

  var drinkTypes = config["drinkTypes"];
  var siteNames = config["sites"];
  var sites = new Sites(siteNames);
  var bp = new BuildTable(2, fileIds);
  var summary = bp.getBuildSummary(sites, drinkTypes);
  
  for (var i=0; i<sites.siteNames.length; i++) {
    ASSERT_TRUE(tDrinksExpected(summary.site[i].buildTo.count, e_buildTo[i]), "TEST FAILED: Site " + sites.siteNames[i] + " buildTo");
    ASSERT_TRUE(tDrinksExpected(summary.site[i].inFridge.count, e_inFridge[i]), "TEST FAILED: Site " + sites.siteNames[i] + " inFridge");
    ASSERT_TRUE(tDrinksExpected(summary.site[i].dead.count, e_dead[i]), "TEST FAILED: Site " + sites.siteNames[i] + " dead");
  }
  
  return true;
}


function tLogHistory(config, buildId, fileIds)
{
  logBuild(buildId, fileIds);

  SpreadsheetApp.flush();
  return true;
}

function tGetPrevBuild(config, fileIds)
{
  var history = new BuildHistory(fileIds);
  var summary = history.getPrevBuildSummary(config.sites, config.drinkTypes, 1);
  Logger.log(summary);
}

function tBuildHistory(config, fileIds)
{
  var history = new BuildHistory(fileIds);  // Grab the previous 'n' build histories of the other build
  var targetBuildId = 1;
  var summaries = history.getBuildSummaries(config.sites, config.drinkTypes, targetBuildId, config.nWeeks);

  Logger.log("==== History for BuildId " + targetBuildId + " over " + config.nWeeks + " weeks ====");
  for (var sumi=0; sumi < summaries.length; sumi++) {
    for (var si=0; si < config.sites.length; si++) {
      var siteBuild = summaries[sumi].site[si];
      Logger.log("==> inFridge ( " + sumi + "): " + config.sites[si]);
      Logger.log("(" + siteBuild.inFridge.toString() + ")");
      Logger.log("==> buildTo ( " + sumi + "): " + config.sites[si]);
      Logger.log("(" + siteBuild.buildTo.toString() + ")");
      Logger.log("==> dead ( " + sumi + "): " + config.sites[si]);
      Logger.log("(" + siteBuild.dead.toString() + ")");
      Logger.log("==> sold ( " + sumi + "): " + config.sites[si]);
      Logger.log("(" + siteBuild.sold.toString() + ")");
    }
  }
       
  //Logger.log(summaries);
}

function tGenerateTargets(buildId, fileIds)
{
  ASSERT_TRUE(typeof buildId == "number" && (buildId == 1 || buildId == 2), "generateTargets: buildId must be either 1 or 2");
  
  var config = getConfig(fileIds.tracker);
    
  var workingBuildId = buildId == 1 ? 2 : 1; // Sold data for this buildId are on the opposite buildId's rows
  
  var history = new BuildHistory(fileIds);  // Grab the previous 'n' build histories of the other build
  var soldHistory = history.getBuildSummaries(config.sites, config.drinkTypes, workingBuildId, config.nWeeks);
  var lastSnapshot = soldHistory[0]; // the last snapshot is always the most recent snapshot of the other build
  
  // get averaged sold amounts from build history
  var targets = getAverageSold(config.sites, config.drinkTypes, soldHistory, config.includeDeadInSold == "y" ? true : false);
  
  Logger.log("=== Sold Aggregate ===");
  Logger.log(targets);
  
  // apply configured adjustment based on config and build sheet being calculated
  var ADJ_FACTOR = buildId==1 ? config.monFactor : config.thuFactor;
  var ZERO_BUMP_UP = typeof config.zeroBumpUp != "undefined" ? config.zeroBumpUp : 0;
}

function doTests() {
  // Dev & testing file Ids
  var newFileIds = getFileIds("1Ot_w-t0raqORz3P0RWHZzutR8j1JqdELeOIctXKGYZY", 
                               "1g5VBsASR6b9KgUSwB-r9OW64AGrAU1L9ga_3j46_Nos", 
                               "1XL1pSr63mjCVO6JJpOBowbiDlC0CCIHLrf7yKI__bew");

  var config = getConfig(newFileIds.tracker);
  
  //ASSERT_TRUE(tBuildPreview(config, newFileIds), "tBuildPreview failed");
  //ASSERT_TRUE(tBuildTable(config, newFileIds), "tBuildTable failed");
  //ASSERT_TRUE(tLogHistory(config, 2, newFileIds), "tLogHistory failed");
  //translateBuildHistory(config, newFileIds, 10)
  //tGetPrevBuild(config, newFileIds);
  //tBuildHistory(config, newFileIds);
  //generateTargets(1, newFileIds);
  //tGenerateTargets(1, newFileIds);
  //generateMondayTargets(newFileIds);
  //generateThursdayTargets(newFileIds);
  //mondayBuildTrigger(newFileIds);
  thursdayBuildTrigger(newFileIds);
}
