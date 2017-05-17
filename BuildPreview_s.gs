/**
 * CONSTRUCTOR object BuildPreview
 * Lightweight mapping from the BuildPreview sheet (Iced Drinks build staging area) to logical operations on actual table
 * @constructor
 * @param {object} fileIds - iced drinks spreadsheet file ids
 */
function BuildPreview(config, fileIds) {
  this.drinksTrackerId = fileIds.tracker;
  this.previewSheet = null;
  this.drinkTypes = config.drinkTypes;
  this.siteNames = config.sites;
  
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
  getTargets: function(ageOffset, buildId)
  {
    var targets = new DrinksSummary(new Date(), this.siteNames, this.drinkTypes);
    var dt, drinkRange, drinkData, site;
    var siteOffset, dayOffset, offset;
    
    for (var dti=0; dti < this.drinkTypes.length; dti++) {
      dt = this.drinkTypes[dti];
      drinkRange = this.previewSheet.getRangeByName(dt);
      ASSERT_TRUE(drinkRange!=null, "No Range name '" + dt + "' found in spreadsheet");
      
      drinkData = drinkRange.getValues()[0];
      for (var si=0; si<this.siteNames.length; si++) {
        if (!targets.hasSiteNum(si)) {
          Logger.log('------------------------> Adding new DrinksSummary site (%s)', si);
          targets.addDrinks(si, new IcedDrinks(this.drinkTypes));
        }
        siteOffset=si * this.siteOffsetMultiplier;
        dayOffset=buildId==1?this.MondayOffset:this.ThursdayOffset;
        offset=siteOffset + dayOffset + ageOffset;
        
        if (BU.isNumber(drinkData[offset])) {
          targets.setCount(si, dt, parseInt(drinkData[offset]));
        }
        else {
          Logger.log("BuildPreview.getTargets: %s.%s is non numeric, setting to null (build table override will be used)", this.siteNames[si], this.drinkTypes[dti]);
          targets.setCount(si, dt, null);   // if not a number set value to null to indicate no value for it
        }

        //Logger.log("  " + dt + ": " + this.siteNames[si] + " found (" + drinkData[offset] + ") at offset " + offset);
      }
    }
    
    return targets;
  },

  /*
   * Get the NEW drinks targets on the Build Preview Sheet
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {string[]} siteNames - the list of configured site names that we are using
   * @param {string[]} drinkTypes - the list of configured drink types that we are using
   * @returns {Object} - a DrinksSumamry object containing the targets
   */
  getNewTargets: function(buildId) {
    Logger.log("<<< Getting New targets from Build Preview sheet (buildId: %s) >>>", buildId); 
    
    var targets = this.getTargets(this.NewOffset, buildId);
    Logger.log("--- New BuildPreview targets:\n%s", targets.toString());
    
    return targets;
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
    var drink, drinkRow, dayOffset, siteOffset, offset, value;
    
    for (si = 0; si < this.siteNames.length; si++) {
      for (dti=0; dti < this.drinkTypes.length; dti++) {
        drink = this.drinkTypes[dti];
        //var drink = siteTargets.drinkTypes[dti];
        var drinkRange = this.previewSheet.getRangeByName(drink);
        ASSERT_TRUE(drinkRange!=null, "No Range name '" + drink + "' found in spreadsheet")
 
        drinkRow = drinkRange.getValues();
        dayOffset = buildId == 1 ? this.MondayOffset : this.ThursdayOffset;
        siteOffset = si * this.siteOffsetMultiplier;
        offset = dayOffset + siteOffset + ageOffset;

        if (drinksSummary.site[si] && drinksSummary.site[si].drinks.count[drink]) {
          value = Math.ceil(drinksSummary.site[si].drinks.count[drink]);  // round values up
          //Logger.log("Setting preview value '%s' for %s (%s)", value, this.siteNames[si], drink);
          drinkRow[0][offset] = value;
        }
        else {
          Logger.log("NULL found for %s (%s) - setting '-'", this.siteNames[si], drink);
          drinkRow[0][offset] = "-";  // if value is not a number, set cell to indicate that no number was generated
        }
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
    Logger.log("<<< Setting new Build Preview targets for buildId %s >>>", buildId);
    Logger.log("--- drinkTypes: %s, siteNames %s", this.drinkTypes, this.siteNames);
    Logger.log(drinksSummary.toString());
    
    this.setTargets(this.NewOffset, buildId, drinksSummary);
  },

  /*
   * Set the PREV drinks targets on the Build Preview Sheet
   * @param {int} buildId - the build Id of the targets we are interested in. 1=Monday, 2=Thursday
   * @param {Object} drinksSummary - a DrinksSummary object containing the iced drink counts accross all the sites we are working with
   */
  setPrevTargets: function(buildId, drinksSummary) {
    Logger.log("<<< Setting previous Build Preview targets for buildId %s >>>", buildId);
    Logger.log("--- drinkTypes: %s, siteNames %s", this.drinkTypes, this.siteNames);
    Logger.log(drinksSummary.toString());
    
    this.setTargets(this.PrevOffset, buildId, drinksSummary);
  }
}