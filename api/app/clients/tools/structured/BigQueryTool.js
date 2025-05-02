/**
 * BigQueryTool
 *
 * A tool for running SQL queries against Google BigQuery. Requires the environment to have access to BigQuery (e.g., running in a GCP VM with appropriate permissions).
 *
 * Input schema:
 *   - query: string (required) - The SQL query to execute.
 *   - projectId: string (optional) - GCP project ID (if not using default).
 *   - location: string (optional) - BigQuery location.
 *   - maxResults: number (optional) - Maximum number of rows to return.
 */
const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { BigQuery } = require('@google-cloud/bigquery');

class BigQueryTool extends Tool {
  static lc_name() {
    return 'BigQueryTool';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'bigquery_tool';
    this.description =
      'Run SQL queries against Google BigQuery. Useful for data analysis and reporting.';
    this.schema = z.object({
      query: z.string().min(1).describe('The SQL query string to execute.'),
      projectId: z.string().optional().describe('GCP project ID (optional).'),
      location: z.string().optional().describe('BigQuery location (optional).'),
      maxResults: z.number().min(1).optional().describe('Maximum number of rows to return.'),
    });
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validationResult.error.issues)}`);
    }
    const { query, projectId, location, maxResults } = validationResult.data;
    const clientOptions = {};
    if (projectId) { clientOptions.projectId = projectId; }
    if (location) { clientOptions.location = location; }
    const bigquery = new BigQuery(clientOptions);
    try {
      const [job] = await bigquery.createQueryJob({
        query,
        location,
        maxResults,
      });
      const [rows] = await job.getQueryResults();
      return JSON.stringify(rows);
    } catch (err) {
      throw new Error(`BigQuery error: ${err.message}`);
    }
  }
}

module.exports = BigQueryTool; 