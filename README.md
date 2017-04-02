# IcedDrinksLib
Autonomously manage Iced Drinks stock levels and maintain history for data mining

At the Bunker cafes, iced coffees and chocolates are made and bottled by a separate team out of hours for sale in the cafes. Due to their ingredients, these drinks have a short shelf life (9 days) so stock levels need to be managed tightly. The build operation runs twice weekly to allow a constant stream of fresh stock.

In order to effectively manage the stock levels, we dicided to automate their calculation. Based on previous sales it should be (at least nominally) possible to predict future sales and therefore appropriate stock levels in each cafe. This came about after miscalculations resulted in large amounts of wastage in some weeks and barren fridges in others.

The system needed to have the following characteristics:
- Be able to adaptively alter individual cafe target stock levels
- Provide clear information for the build crew
- Be easily usable by cafe staff and bottling staff and other non IT personel
- Needed to be configurable so that the owner / manager could tune or alter the algorithm whenever he thought it might be needed. 
- Needed to be recoverable and fixable when things went wrong or timings altered (build days changing, public holidays etc) by non IT staff
- Had to be clear and foolproof given the high pace and general chaos of a busy cafe environment

Since Google Sheets were familiar to everyone in the cafe and held the possibility of providing a clear and accessable interface I decided to write to the Google Sheets API with Apps Scripts in Javascript. It turned out to be quite flexible and along with the ability to run scripts off timed events provided all that the project needed.

### The system involves 3 main spreadsheets:
1. **The Monday Build Table**

   Fridge stock levels are filled out in this spreadsheet on Mondays by cafe staff and it tells both the bottling team and the cafe staff how much raw ingredients need to be prepared for the build that night. It also contains other calculations for the bottling crew to assist the process.
   ![build-table](https://cloud.githubusercontent.com/assets/5311341/24587099/65cc08ae-17f3-11e7-9c80-a6094fd59831.png)


2. **The Thursday Build Table**

   A simliar spreadsheet for Thursdays preparing for the Thursday night build.

3. **The Iced Drinks Tracker**

   This spreadsheet is the management console for the system. It has a configuration sheet, 2 history tables which keep track of the builds and a Build Preview sheet which acts as a staging area to preview the effects of changes to the build configuration. From the tracker, new build targets can be generated and reviewed in the preview then pushed into the production build tables. The history tables can also be altered manually if something unexpected has happened.
   
   Build Preview
  ![tracker-preview](https://cloud.githubusercontent.com/assets/5311341/24587138/62437586-17f4-11e7-892b-892e4f3224f2.png)

   History (build history)
   ![tracker-history](https://cloud.githubusercontent.com/assets/5311341/24587168/e967beb4-17f4-11e7-9ea3-d6e7b2ba45ea.png)

   History Totals (summary by site)
   ![tracker-history-totals](https://cloud.githubusercontent.com/assets/5311341/24587171/f89cb1f0-17f4-11e7-9018-52391934f8bf.png)

   Config
   ![tracker-config](https://cloud.githubusercontent.com/assets/5311341/24587178/098b1c04-17f5-11e7-971b-4407993bcbcb.png)


### There are 3 main oprations:
1. **logBuild**

   Take the data in the Monday or Thursday build table and put it into the history tables. While doing this it looks at the previous build data to work out how many have been sold. Records are also kept of wastage. This is run on a timed event on Mondays and Thursdays after the in fridge levels have been finalised.

2. **generateTargets**

   Based on the configuration the history is examined to work out what each cafes stock levels should be for the coming week. The results are put into the Build Preview which allows comparison with the previous build for this day.

3. **pushTargets**

   Push the new build targets for the drinks into the appropriate Build Table sheet for the following build. Monday builds are calculated on Thursdays and vice versa to avoid conflict with the bottling crew.

These can all be run manually from a menu on the Build Preview sheet and are run automatically on both Mondays and Thursdays.

Access to the spreadsheet fields are done through named ranges which must match the configured items to which they allow access. e.g. if there is a drink called 'dairyChoc' in the configured drinks to manage, then there must be named ranges of the same name on the Build Tables (Monday and Thursday) and the Build Preview table (Tracker).

## Object Model
The utility functions based on the three operations mentioned above are in the code_s.js file. The other files make up the object model used to interract with the spreadsheets and some utility functions. Originally I intended to put the object model in its own library but the Script Debugger couldn't handle it so I had to combine it all.

### BuildTable
A lightweight constructor object giving access to the data in a build table. Can be used to pull out all the info for the history logging or to set new build targets. Uses:
1. **BuildSummary**

   A comprehensive representation of the entire build - used for the history tables
   
2. **DrinksSummary**

   To set new targets for the build sheet
   
### BuildPreview
A lightweight constructor object allowing access to the data in the Build Preview sheet. Uses:
1. **DrinksSummary**

   To pull and push build target info into the various columns

### BuildHistory
A lightweight constructor object allowing access to the main History table. Uses:
1. **BuildSummary**

   To both retrieve and append comprehensive build snapshots

### BuildHistoryTotals
A lightweight constructor object giving access to the Totals or summary history rows. This summarieses the individual cafe's builds for easy human review. Uses:
1. **BuildSummary**

   To append info needed for table

### BuildSummary
A representation of an entire build accross multiple cafes. Used for build calculations and for populating the history tables

### DrinksSummary
A representations of a specific aspect of a build accross multiple cafes. Used to represent build targets that are synced into the preview table and also pushed accross to the production build sheets

### SiteBuild
A drinks build for a single site. Used mainly in construction of and navigating through a BuildSummary object

### IcedDrinks
A collection of Iced drinks and their counts. Used as part of a DrinksSummary or BuildSummary

### Site
A helper object providing some offset information for accessing data for the site it represents

## Utility Functions
Some helper functions maing things easier

### getConfig
Returns an opject containing all the configuration for the system

### getFileIds / getTestFileIds
Returns an object with the Spreadsheet Ids needed for the system. Production or testing files can be used

