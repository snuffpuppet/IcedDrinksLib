/*
 * Provide a single access point for the Spreadsheet fileIds used in the Iced Drinks project
 * These are the PRODUCTION file Ids
 * 
 * @param {string} opTrackerId - tracker spreadsheetId value to override default
 * @param {string} opMondayId - Monday Build Table spreadsheetId value to override default
 * @param {string} opThursdayId - Thursday Build Table spreadsheetId value to override default
 * @returns {Object} - an object with properties containing the SpreadSheet Ids for the project
 */
function getFileIds(trackerId, mondayId, thursdayId)
{
  ASSERT_TRUE(typeof trackerId === "string", "getFields: tracketId argument must be a string");
  ASSERT_TRUE(typeof mondayId === "string", "getFields: mondayId argument must be a string");
  ASSERT_TRUE(typeof thursdayId === "string", "getFields: thursdayId argument must be a string");
  return {tracker: trackerId, mondayBuild: mondayId, thursdayBuild: thursdayId};
}

