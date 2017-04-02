/*
 * Provide a single access point for the Spreadsheet fileIds used in the Iced Drinks project
 * These are the PRODUCTION file Ids
 * @returns {Object} - an object with properties containing the SpreadSheet Ids for the project
 */
function getFileIds()
{
  return {tracker: "1Ot_w-t0raqORz3P0RWHZzutR8j1JqdELeOIctXKGYZY", 
          mondayBuild: "1g5VBsASR6b9KgUSwB-r9OW64AGrAU1L9ga_3j46_Nos", 
          thursdayBuild: "1XL1pSr63mjCVO6JJpOBowbiDlC0CCIHLrf7yKI__bew"};
}

/*
 * Dev & testing file Ids
 * @returns {Object} - an object with properties containing the SpreadSheet Ids for the project
 */
function getTestFileIds()
{
  return {tracker: "15DAYupfP7jqWa7zfbP3MgavGRRWazooZIQOg00v5qmE", 
          mondayBuild: "1nmiYTDyy16s0qRBjKT51tYNvPoP7TVj5XnKbGd6EtDw", 
          thursdayBuild: "1nmiYTDyy16s0qRBjKT51tYNvPoP7TVj5XnKbGd6EtDw"};
}
