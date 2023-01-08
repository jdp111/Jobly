"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 20000,
    equity: "0.1",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({id:5, ...newJob});

    const result = await db.query(
          `SELECT title, salary
          FROM jobs
           WHERE id= 5`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 20000,
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 10000,
        equity: "0",
        companyHandle: "c1"
      },
      {
        id: 2,
        title: "j2",
        salary: 10000,
        equity:"0.1",
        companyHandle: "c2"
      },
      {
        id: 3,
        title: "j3",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c3"
      },
      {
        id: 4,
        title: "j4",
        salary: 30000,
        equity: null,
        companyHandle: "c1"
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
            id: 1,
            title: "j1",
            salary: 10000,
            equity: "0",
            companyHandle: "c1"
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(8);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "anotherTitle",
    salary: 100000,
    equity: "0.9",
    companyHandle: "c3"
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      ...updateData,
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
        title: "anotherTitle",
        salary: 100000,
        equity: "0.9",
        company_handle: "c3"
      }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(8, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT title FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(50);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
