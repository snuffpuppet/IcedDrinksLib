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
