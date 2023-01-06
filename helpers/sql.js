const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Turns an updated json object into a segment of SQL query
 * returns an object with a query string and an array of updated values.
 * 
 * dataToUpdate has key/value pairs that indicate SQL columns and their updated values
 *   ex. {"firstName": "Jill", "age": "11"}
 * 
 * jsToSql converts common json key names into common SQL column names
 *    ex. {"firstName":"first_name"}
 * 
 * if no data is entered, an error with "No data" is thrown
 * 
 * returns {setCols, values}
 * setCols is a partial SQL query that updates specified columns
 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0){throw new BadRequestError("No data")};

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
