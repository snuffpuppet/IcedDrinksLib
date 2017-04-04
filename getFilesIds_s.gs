/*
 * Provide a single access point for the Spreadsheet fileIds used in the Iced Drinks project
 * These are the PRODUCTION file Ids
 * 
 * @param {string} trackerId - tracker spreadsheetId value to override default
 * @param {string} mondayId - Monday Build Table spreadsheetId value to override default
 * @param {string} thursdayId - Thursday Build Table spreadsheetId value to override default
 * @param {string} optLogId - Optional spreadsheet to use for BetterLog logs
 * @returns {Object} - an object with properties containing the SpreadSheet Ids for the project
 */
function getFileIds(trackerId, mondayId, thursdayId, optLogId)
{
  ASSERT_TRUE(typeof trackerId === "string", "getFields: tracketId argument must be a string");
  ASSERT_TRUE(typeof mondayId === "string", "getFields: mondayId argument must be a string");
  ASSERT_TRUE(typeof thursdayId === "string", "getFields: thursdayId argument must be a string");
  return {tracker: trackerId,
          mondayBuild: mondayId,
          thursdayBuild: thursdayId,
          log: typeof optLogId === "string" ? optLogId : null};
}

