/* 
 * CONSTRUCTOR object for a collection of Iced Drinks
 * Represent an Iced Drinks collection so that we can store and manipulate collections of Iced Drinks data
 * @constructor
 * @param {string[]} drinkTypes - a list of the configured drink types that we are working with
 */
function IcedDrinks(drinkTypes) {
  this.total = 0;
  this.count = {};  // collection of drinks and their quantities
  if (typeof drinkTypes !== 'undefined')
    this.drinkTypes = drinkTypes;
  else
    this.drinkTypes = ['soy', 'fc', 'fcTriple', 'light', 'darkChoc', 'darkMocha', 'darkSoyChoc', 'dairyChoc', 'dairyChocFlav'];
  // set up the array for drinks we are interested in but set their values to 'unset' i.e. null
  for (var dti in this.drinkTypes) {
    var dt = this.drinkTypes[dti];
    this.count[dt] = 0;
  }
}

IcedDrinks.prototype = {
  /* 
   * add 'num' to the drinks count for 'drink'
   * @param {string} drink - the drink that we wish to effect
   * @param {int{ num - the amount by which we should increase the count
   */
  add: function(drink, num)
  {
    this.count[drink] += num;
    this.total += num;
  },

  /* 
   * aggregate: add the drinks from the parameter to this drinks object
   * @param {Object} toAdd - another IcedDrinks object containing counts 
   */
  aggregate: function(toAdd)
  {
    for (var dti in this.drinkTypes) {
      var dt = this.drinkTypes[dti];
      this.count[dt] += toAdd.count[dt];
      this.total += toAdd.count[dt];
    }
  },

  /* 
   * assign: overwrite the counts in this object with the ones given
   * @param {Object} toAssign - another IcedDrinks object containing counts 
   * @deprecated - no longer needed
   */
  assign: function(toAssign)
  {
    for (var dti in this.drinkTypes) {
      var dt = this.drinkTypes[dti];
      this.count[dt] = toAssign.count[dt];
      this.total += toAssign.count[dt];
    }
  },

  /* 
   * applyCoefficient: multiply all the members of this collection with the given factor
   * @param {int} n - the factor by which to multiply
   * @param {boolean} optRound - optional rounding if set to true
   */
  applyCoefficient: function(n, optRound)
  {
    var round = (typeof optRound == 'undefined') ? false : optRound;
    this.total = 0;
    for (var dti in this.drinkTypes) {
      var dt = this.drinkTypes[dti];
      this.count[dt] *= n;
      if (round)
        this.count[dt] = Math.round(this.count[dt]);
      this.total += this.count[dt];
    }
  },
  
  /* 
   * toString: convert the object to a printable string
   * @returns {string}
   */
  toString: function()
  {
    var s="T:" + this.total + " [";
    for (var dti in this.drinkTypes) {
      var dt = this.drinkTypes[dti];
      s += " " + dt + ":" + this.count[dt];
    }
    s += " ]";
    return s;
  }
}