/*
 * @constructor
 * @param {Object[]} buildSummaries - a sequence of build summaries from a specific build day
 */
function BuildSummarySequence(siteNames, drinkTypes, buildId, buildSummaries) {
  this.summaries = buildSummaries;
  this.siteNames = siteNames;
  this.drinkTypes = drinkTypes;
  this.buildId = buildId;
}

BuildSummarySequence.prototype = {
  /*
   * generateSoldSummary:
   * Provide access for an aggregator function to the sequence of sold values for each drink
   * @param {Object} config - the config object to drive the algorithm in the aggregator function
   * @param {Function(config, buildId, siteNum. drink, seqLength, soldAmounts)} aggregator - the function to run accross all drinks' sold values
   */
  generateSoldSummary: function(config, aggregator) {
    var si;
    var site;
    var siteNum;
    var drink;
    var drinkNum, siteSummary;
    var soldAmounts = [];
    var soldDrinks, deadDrinks, inFridgeDrinks;
    var inFridgeNow, buildToNow;
    var targetSummary = new DrinksSummary(new Date(), this.siteNames, this.drinkTypes);
    var newTargets;
    
    //
    // Create an array of sold values from the each of the summaries for each drinkType over each of the sites.
    // Loop over each of the sites and each of its drinks and then combine all the sold values for that site,drinkType combo
    // pass that to the given aggragtor function to calulate a new target value for that drink at that site
    //
    Logger.log("generating " + this.summaries.length + " week sold summary for buildId " + this.buildId + ", [" + this.siteNames + "], [" + this.drinkTypes + "]");
    for (siteNum = 0; siteNum < this.siteNames.length; siteNum++) {
      site = this.siteNames[siteNum];
      newTargets = new IcedDrinks(this.drinkTypes); // sold Drinks aggregate -> new targets
      targetSummary.addDrinks(siteNum, newTargets);
      
      for (drinkNum = 0; drinkNum < this.drinkTypes.length; drinkNum++) {
        drink = this.drinkTypes[drinkNum];
        soldAmounts=[];
        for (si=0; si < this.summaries.length; si++) {
          siteSummary = this.summaries[si].site[siteNum];
          if (siteSummary) {
            soldDrinks = siteSummary.sold;
            deadDrinks = siteSummary.dead;
            inFridgeDrinks = siteSummary.inFridge;
            if (soldDrinks && soldDrinks.count[drink] != null) {
              if (inFridgeDrinks.count[drink] !== 0 || soldDrinks.count[drink] !== 0) {
                soldAmounts[soldAmounts.length] = soldDrinks.count[drink];
                if (config.includeDeadInSold == "y")
                  soldAmounts[soldAmounts.length-1] += deadDrinks.count[drink];
              }
              else
                Logger.log("bId:%s, site:%s, %s - inFridge and sold are 0 (summary #%s) - skipping", this.buildId, siteNum, drink, si);
            }
            else
              Logger.log("bId:%s site:%s, %s - no sold data for %s (summary #%s) - skipping", this.buildId, siteNum, drink, site, si);
          }
          else
            Logger.log("bId:%s site:%s, %s - no site %s in summary #%s - skipping", this.buildId, siteNum, drink, site, si);
        }
        // soldAmounts contains all the sold values for this drink (and may even be empty for newly added drinks)
        inFridgeNow = this.summaries[0].site[siteNum].inFridge.count[drink];
        buildToNow = this.summaries[0].site[siteNum].buildTo.count[drink];

        targetSummary.site[siteNum].drinks.count[drink] = aggregator(config, this.buildId, siteNum, drink, this.summaries.length, soldAmounts, inFridgeNow, buildToNow);
      }
    }
    
    return targetSummary;
  }
}