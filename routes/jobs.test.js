"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 80000,
    equity: "0.5",
    companyHandle: "c1"
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    //expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {id:5, ...newJob}
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error).toEqual({
      "message": "Unauthorized", "status":401
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new2",
          salary: 10000
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          id:2,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id:1,
                title: "j1",
                salary: 10000,
                equity:"0",
                companyHandle: 'c1'
              },
              {
                id:2,
                title: "j2",
                salary: 10000,
                equity: "0.1",
                companyHandle: 'c2'
              },
              {
                id:3,
                title: "j3",
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c3'
              },
              {
                id:4,
                title: "j4",
                salary:30000,
                equity:null,
                companyHandle: 'c1'
              }
          ],
    });
  });

  test("sort by title", async function() {
    const resp = await request(app).get("/jobs?title=j1")
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id:1,
                title: "j1",
                salary: 10000,
                equity:"0",
                companyHandle: 'c1'
              },
          ],
    });
  })

  test("sort by minSalary", async function() {
    const resp = await request(app).get("/jobs?minSalary=25000")
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id:4,
                title: "j4",
                salary:30000,
                equity:"0.3",
                companyHandle: 'c1'
              }
          ],
    });
  })

  test("sort by equity", async function() {
    const resp = await request(app).get("/jobs?hasEquity=false")
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id:1,
                title: "j1",
                salary: 10000,
                equity:"0",
                companyHandle: 'c1'
            },
            {
                id:4,
                title: "j4",
                salary:30000,
                equity:null,
                companyHandle: 'c1'
              }
          ],
    });
  })

  
  test("unauthorized sorter", async function(){
    const resp = await request(app).get("/companies?title=j2&id=2")
    expect(resp.text).toEqual("{\"error\":{\"message\":[\"instance additionalProperty \\\"cred\\\" exists in instance when not allowed\"],\"status\":400}}")
  })

  test("no results", async function() {
    const resp = await request(app).get("/jobs?title=j1&minSalary=900000")
    expect(resp.body.jobs).toEqual({
      "message": "no results found"
    });
  })

});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/j1`);
    expect(resp.body).toEqual({
      job: {
        id:1,
        title: "j1",
        salary: 10000,
        equity:"0",
        companyHandle: 'c1'
    },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          name: "altered",
          salary: "100000"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id:1,
        title: "altered",
        salary: 100000,
        equity:"0",
        companyHandle: 'c1'
    },
    });
  });

  test("unauth for not admin", async function (){
    const resp = await request(app)
        .patch(`/jobs/2`)
        .send({
          title: "j2-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body.error).toEqual({
      "message": "Unauthorized", "status": 401
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/2`)
        .send({
          title: "j2-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/2`)
        .send({
          id: "j2-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/2`)
        .send({
          salary: "50000",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("unauthorized for user", async function (){
    const resp = await request(app)
        .delete(`/jobs/2`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body.error).toEqual({"message":"Unauthorized", "status":401});
  });
  
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/2`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ "deleted job with ID": 2 });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

});
