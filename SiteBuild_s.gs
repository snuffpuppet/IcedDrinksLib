/*
 * CONSTRUCTOR object SiteBuild
 * represents the build for a particular site. Used in Build Summaries
 * @constructor
 * @param {Object} date - a Date object representing the date of this build
 * @param {Object} site - a Site object indicating the site of this build
 * @param {int} buildId - the build Id of this build (build Sheet)
 * @param {Object} buidTo - an IcedDrinks object containing the count of drinks to build to
 * @param {Object} inFridge - an IcedDrinks object containing the count of drinks in fridge
 * @param {Object} dead - an IcedDrinks object containing the count of wastage drinks 
 * @param {Object} sold - an IcedDrinks object containing the count of sold drinks
 */
function SiteBuild(date, site, buildId, buildTo, inFridge, dead, sold) {
  this.date = date;
  this.site = site;
  this.buildId = buildId;
  this.buildTo = buildTo;
  this.inFridge = inFridge;
  this.making = inFridge.total > buildTo.total ? 0 : buildTo.total - inFridge.total;
  this.dead = dead;
  this.sold = null;
  if (typeof sold != "undefined") {
    this.sold = sold;
  }
}

/*
 * toString() - stringify the object
 * @returns {string}
 */
SiteBuild.prototype = {
  toString: function() {
    var s = "SB (" + this.date + ", " + this.site.name + ", " + this.buildId + ")\n";
    s += "[bt: " + this.buildTo.toString() + "]\n";
    s += "[if: " + this.inFridge.toString() + "]\n";
    s += "[d: " + this.dead.toString() + "]\n";
    s += "[s: " + this.sold ? this.sold.toString() : "null" + "]\n";
    
    return s;
  }
}