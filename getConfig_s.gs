/*
 * getConfig
 *
 * Function to return a config object
 * read ALL THE CONFIGS from the config tab on the drinks tracker sheet and set them as properties of the returned object
 * @param {string} sheetId - the SpreadSheet Id of the DrinksTracker with the config tab
 * @returns {Object} - an object containing the configured parameters of the system. From the DrinksTracker SS, config tab
 */
function getConfig(sheetId) {
  var configSheet = SpreadsheetApp.openById(sheetId).getSheetByName('Config');
  var configRange = configSheet.getDataRange().offset(1, 0);
  var configData = configRange.getValues();
  var config = {};
  
  for (var i=0; i<configRange.getNumRows(); i++) {
    var parameter = configData[i][0];
    var pValue = configData[i][1];
    var pSubValue = configData[i][2];
    var value = null; // actual extracted value
    
    if (pSubValue != "") {
      if (typeof config[parameter] === 'undefined') 
        config[parameter] = [];
      if (/.*,.*/.test(pSubValue)) { // there are commas, it's an array
        value = pSubValue.split(/[ ]*,[ ]*/);
      }
      else {
        value = pSubValue;
      }
      config[parameter][pValue] = value;
    }
    else {
      if (/.*,.*/.test(pValue)) { // there are commas, it's an array
        value = pValue.split(/[ ]*,[ ]*/);
      }
      else {
        value = pValue;
      }
      config[parameter] = value;
    }
  }
  return config;
}
