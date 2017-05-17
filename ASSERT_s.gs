/*
 * A simple assert function to help with exception management
 * @param {boolean} test - condition to be tested
 * @param {string} message - error message if test fails
 */
function ASSERT_TRUE(test, message) {
  if (!test) {
    Logger.log('!!! EXCEPTION THROWN: %s', message);
    throw (message);
  }
}
