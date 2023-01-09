const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query(`
  DELETE FROM applications;
  DROP TABLE applications;
  DELETE FROM jobs;
  DROP TABLE jobs;
  `)
  
  await db.query(`
  CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary INTEGER CHECK (salary >= 0),
    equity NUMERIC CHECK (equity <= 1.0),
    company_handle VARCHAR(25) NOT NULL
      REFERENCES companies ON DELETE CASCADE
  );
  `)

  await db.query(`
  CREATE TABLE applications (
    username VARCHAR(25)
      REFERENCES users ON DELETE CASCADE,
    job_id INTEGER
      REFERENCES jobs ON DELETE CASCADE,
    PRIMARY KEY (username, job_id)
  );`)

  

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);

  await db.query(`
      INSERT INTO jobs(title,salary,equity,company_handle)
      VALUES('j1','10000','0','c1'),
      ('j2','10000','.1','c2'),
      ('j3','20000','.2','c3'),
      ('j4','30000',NULL,'c1')`);
  
  
  await db.query(`
    INSERT INTO applications (username, job_id)
    VALUES('u1',1),
      ('u1',3)
  `);

}

  

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};