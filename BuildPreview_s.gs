/**
 * CONSTRUCTOR object BuildPreview
 * Lightweight mapping from the BuildPreview sheet (Iced Drinks build staging area) to logical operations on actual table
 * @constructor
 * @param {object} fileIds - iced drinks spreadsheet file ids
 */
function BuildPreview(fileIds) {
  this.drinksTrackerId = fileIds.tracker;
  this.previewSheet = null;
  
  this.MondayOffset = 0;    // Monday columns start at 0 of range
  this.ThursdayOffset = 2;  // Thursday columns offset;
  this.siteOffsetMultiplier = 5;
  this.PrevOffset = 0;
  this.NewOffset = 1;
  
  this.previewSheet = SpreadsheetApp.openById(this.drinksTrackerId);
      
}

BuildPreview.prototype = {
  /*
   * Get drinks targets from the Build Preview Sheet
   * @param {int} ageOffset - the offset to be used depending on weather we want the new or old targets
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {string[]} siteNames - the list of configured site names that we are using
   * @param {string[]} drinkTypes - the list of configured drink types that we are using
   * @returns {Object} - a DrinksSumamry object containing the targets
   */
  getTargets: function(ageOffset, buildId, siteNames, drinkTypes)
  {
    var targets = new DrinksSummary(new Date(), siteNames, drinkTypes);
    Logger.log("==> BuildPreview.getTargets(ageOffset: " + ageOffset + ", buildId: " + buildId + ")");
    
    for (var dti=0; dti <drinkTypes.length; dti++) {
      var dt = drinkTypes[dti];
      var drinkRange = this.previewSheet.getRangeByName(dt);
      ASSERT_TRUE(drinkRange!=null, "No Range name '" + dt + "' found in spreadsheet");
      
      var drinkData = drinkRange.getValues()[0];
      for (var si=0; si<siteNames.length; si++) {
        var site=targets.site[si];
        var siteOffset=si * this.siteOffsetMultiplier;
        var dayOffset=buildId==1?this.MondayOffset:this.ThursdayOffset;
        var offset=siteOffset + dayOffset + ageOffset;
        site.drinks.count[dt] = parseInt(drinkData[offset]);
        Logger.log("  " + dt + ": " + siteNames[si] + " found (" + drinkData[offset] + ") at offset " + offset);
      }
    }
    Logger.log("  BuildPreview got Targets:")
    Logger.log(targets.toString());
    Logger.log("<==");
    
    return targets;
  },

  /*
   * Get the NEW drinks targets on the Build Preview Sheet
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {string[]} siteNames - the list of configured site names that we are using
   * @param {string[]} drinkTypes - the list of configured drink types that we are using
   * @returns {Object} - a DrinksSumamry object containing the targets
   */
  getNewTargets: function(buildId, siteNames, drinkTypes) {
    return this.getTargets(this.NewOffset, buildId, siteNames, drinkTypes);
  },

  /*
   * Set the drinks targets on the Build Preview Sheet at the offset given
   * @param {int} ageOffset - the offset to be used depending on weather we want the new or old targets
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {Object} drinksSummary - a DrinksSummary object containing the iced drink counts accross all the sites we are working with
   */
  setTargets: function(ageOffset, buildId, drinksSummary) {
    var si; // Site Index
    var dti; // Drink Type Index
    for (si = 0; si < drinksSummary.numSites; si++) {
      var siteTargets = drinksSummary.site[si].drinks;
      for (dti=0; dti < siteTargets.drinkTypes.length; dti++) {
        var drink = siteTargets.drinkTypes[dti];
        var drinkRange = this.previewSheet.getRangeByName(drink);
        ASSERT_TRUE(drinkRange!=null, "No Range name '" + drink + "' found in spreadsheet")
      
        var drinkRow = drinkRange.getValues();
        var dayOffset = buildId == 1 ? this.MondayOffset : this.ThursdayOffset;
        var siteOffset = si * this.siteOffsetMultiplier;
        var offset = dayOffset + siteOffset + ageOffset;
        
        drinkRow[0][offset] = Math.ceil(siteTargets.count[drink]); // round values up
        drinkRange.setValues(drinkRow);
      }
    }
  },

  /*
   * Set the NEW drinks targets on the Build Preview Sheet
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {Object} drinksSummary - a DrinksSummary object containing the iced drink counts accross all the sites we are working with
   */
  setNewTargets: function(buildId, drinksSummary) {
    Logger.log("==> BuildPreview.setNewTargets for " + drinksSummary.site[0].drinks.drinkTypes.length + " drinks accross " + drinksSummary.numSites + " sites ");
    Logger.log(drinksSummary.toString());
    this.setTargets(this.NewOffset, buildId, drinksSummary);
  },

  /*
   * Set the PREV drinks targets on the Build Preview Sheet
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {Object} drinksSummary - a DrinksSummary object containing the iced drink counts accross all the sites we are working with
   */
  setPrevTargets: function(buildId, drinksSummary) {
    Logger.log("==> BuildPreview.setPrevTargets for " + drinksSummary.site[0].drinks.drinkTypes.length + " drinks accross " + drinksSummary.numSites + " sites ");
    Logger.log(drinksSummary.toString());
    this.setTargets(this.PrevOffset, buildId, drinksSummary);
  }
}