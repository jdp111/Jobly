"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



/** Related functions for jobs. */
class Job{

    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */
    static async create({title,salary,equity,companyHandle}){
        const duplicateCheck = await db.query(
            `SELECT title
             FROM jobs
             WHERE company_handle = $1
             AND title = $2
             `,
          [companyHandle, title]);
  
      if (duplicateCheck.rows[0]){
        throw new BadRequestError(`Duplicate job: ${title} from company handle: ${companyHandle}`);
      }
      const result = await db.query(
            `INSERT INTO jobs
             (title,salary,equity,company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id,title,salary,equity,company_handle AS "companyHandle"`,
          [title,salary,equity,companyHandle],
      );
      const job = result.rows[0];
  
      return job;
    }

    /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
    static async findAll() {
        const companiesRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle as "companyHandle"
               FROM jobs
               ORDER BY title`);
        return companiesRes.rows;
      }


    /** Sorts all jobs by query parameters
   * 
   * first input sorters from query strings
   *    sorters : {title,company,minSalary,minEquity}
   *   ex. {"title":"Software Engineer", "company": "hall-davis", "minSalary":30000, "minEquity":130000}
   * 
   * second input all companies from "finAll()"
   * 
   * returns list of jobs filtered by query strings
   * 
   */
  static sortAll(sorters, allJobs){
    console.log("sorting initiated")
    let sortedJobs = allJobs
    

    if (sorters.title){
        sortedJobs  = sortedJobs.filter((x) =>x.title.includes(sorters.title) )
    }
    
    if (sorters.minSalary){
      console.log(parseInt(sorters.minSalary))
        sortedJobs = sortedJobs.filter((x)=>parseInt(x.salary) >= parseInt(sorters.minSalary))
    }

    if (sorters.hasEquity == "true"){
        sortedJobs = sortedJobs.filter((x)=> !!(parseFloat(x.minEquity)))
    }

    if (!sortedJobs[0]){
      return {"message":"no results found"}
    }

    return sortedJobs;
  }


  /** Given a Job id , return data about job.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                title,
                salary,
                equity,
                company_handle as "companyHandle"
           FROM jobs
           WHERE id= $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with ID: ${id}`);

    return job;
  }



  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title,salary,equity,companyHandle}
   *
   * Returns {id,title,salary,equity,companyHandle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                title, 
                                salary,
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with ID: ${id}`);

    return job;
  }


  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with ID: ${id}`);
  }

}

module.exports = Job;