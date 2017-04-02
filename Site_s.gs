/*
 * Convenience CONSTRUCTOR object for Site specific information
 * The site id is just the index in the list of configured sites
 * @param {string[]} siteNames - the list of configured site names we are working with
 * @param {int} siteId - this site Id
 * @returns {Object} - an object containing some convenience details about the site
 *   .siteNames - the full list of site names
 *   .id - the Id if this site
 *   .name - the specific name of this site
 *   .previewTableOffset - the offset to access this sites items in the Build Preview Table
 *   .buidTableOffset - the offset to access this sites items in the Build Table
 */
function Site(siteNames, siteId) {
  var previewStart = 0;
  var buildStart = 0;
  
  var previewMultiple = 2;
  var buildMultiple = 3;

  this.siteNames = siteNames;
  this.id = siteId;
  this.name = siteNames[siteId];
  this.previewTableOffset = previewStart + previewMultiple * siteId;
  this.buildTableOffset = buildStart + buildMultiple * siteId;
}
