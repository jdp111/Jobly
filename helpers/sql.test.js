const { BadRequestError } = require("../expressError");
const {sqlForPartialUpdate} = require("./sql")



describe("sql partial query", function () {
    test("works with less definition", function () {
        const sql = sqlForPartialUpdate({"firstName": "Jill", "age": "11"}, {"firstName":"first-name"})
        expect(sql.setCols).toEqual("\"first-name\"=$1, \"age\"=$2")
    });
});
  