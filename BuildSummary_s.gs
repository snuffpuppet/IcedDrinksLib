/*
 * Representation of a single sites total Iced Drink build
 * This is one of the main workhorses of the code as it is used as the basic item upon which
 * we do calculations, and translations to and from physical representations of the builds
 * @constructor
 * @param {Object} date - A Date object containing the date of this build summary
 * @param {string[]} siteNames - a list of the configured site names we are working with
 * @param {int} buildId - the buildId of the build this represents - 1=Monday, 2=Thursday
 */
function BuildSummary(date, siteNames, buildId) {
  this.date = date;
  this.siteNames = siteNames;
  this.numSites = 0;
  this.buildId = buildId;
  this.making = 0;
  this.site = [];
}

BuildSummary.prototype = {
  /*
   * addBuild: add this sites drinks build to the build summary collection
   * @param {Object} siteBuild - A SiteBuild object representing a drinks build for a specific site
  */
  addBuild: function(siteBuild) {
    this.site[this.site.length] = siteBuild;
    this.numSites++;
    this.making += siteBuild.making;
  },
  
  /*
   * getBuildIdSummary:
   * generate a DrinksSummary object for the buildTo section of this BuildSummary
   * @param {string[]} drinkTypes - the list of configured drink types we are working with
   * @returns {Object} - a DrinksSummary object
   */
  getBuildToSummary: function(drinkTypes) {
    var dSum = new DrinksSummary(this.date, this.siteNames, drinkTypes);
    ASSERT_TRUE(this.numSites > 0, "BuildSummary.getBuildToSummary - BuildSummary has no sites, cannot get drinks");
    
    for (var si=0; si< this.numSites; si++) {
      dSum.addDrinks(si, this.site[si].buildTo);
    }
    
    return dSum;
  },
  
  /*
   * toString: stringify the object for debugging purposes
   * @returns {string}
   */
  toString: function() {
    var s="BS (" + this.date + ", "  + this.buildId + ") {{" + "\n";
    for (var i=0; i<this.site.length; i++) {
      s += this.site[i].toString() + "\n";
    }
    s +="}}";
    return s;
  }

}
