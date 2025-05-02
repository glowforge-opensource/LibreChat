const BigQueryTool = require('../BigQueryTool');

jest.mock('@google-cloud/bigquery', () => {
  const mJob = { getQueryResults: jest.fn() };
  const mBigQuery = jest.fn().mockImplementation(() => ({
    createQueryJob: jest.fn(),
  }));
  return { BigQuery: mBigQuery };
});

describe('BigQueryTool', () => {
  let BigQuery;
  beforeEach(() => {
    jest.resetModules();
    BigQuery = require('@google-cloud/bigquery').BigQuery;
  });

  it('should throw an error if query is missing', async () => {
    const tool = new BigQueryTool();
    await expect(tool._call({})).rejects.toThrow('Validation failed');
  });

  it('should instantiate BigQuery client with projectId and location', async () => {
    const tool = new BigQueryTool();
    const mockCreateQueryJob = jest.fn().mockResolvedValue([{ getQueryResults: jest.fn().mockResolvedValue([[]]) }]);
    BigQuery.mockImplementation(() => ({ createQueryJob: mockCreateQueryJob }));
    await tool._call({ query: 'SELECT 1', projectId: 'pid', location: 'us' });
    expect(BigQuery).toHaveBeenCalledWith({ projectId: 'pid', location: 'us' });
    expect(mockCreateQueryJob).toHaveBeenCalledWith({ query: 'SELECT 1', location: 'us', maxResults: undefined });
  });

  it('should return rows as JSON', async () => {
    const tool = new BigQueryTool();
    const rows = [{ foo: 'bar' }];
    const mockGetQueryResults = jest.fn().mockResolvedValue([rows]);
    const mockCreateQueryJob = jest.fn().mockResolvedValue([{ getQueryResults: mockGetQueryResults }]);
    BigQuery.mockImplementation(() => ({ createQueryJob: mockCreateQueryJob }));
    const result = await tool._call({ query: 'SELECT 1' });
    expect(result).toBe(JSON.stringify(rows));
  });

  it('should throw an error if BigQuery throws', async () => {
    const tool = new BigQueryTool();
    const mockCreateQueryJob = jest.fn().mockRejectedValue(new Error('bq fail'));
    BigQuery.mockImplementation(() => ({ createQueryJob: mockCreateQueryJob }));
    await expect(tool._call({ query: 'SELECT 1' })).rejects.toThrow('BigQuery error: bq fail');
  });
}); 