import type { QueryConfig, QueryResult, QueryResultRow } from "pg"
import { Pool } from "pg"

let dbPool: Pool | undefined

// host and port come from PGHOST/PGPORT, defaulting to localhost:5432. docker-compose sets PGHOST=db.
const getDbPool = () => {
  dbPool ??= new Pool({
    database: "ploxnotes",
    user: "postgres",
    password: "postgres",
  })
  return dbPool
}

// Use this for single query
export const query = <T extends QueryResultRow = any>(stuff: QueryConfig) =>
  getDbPool().query<T>(stuff)

export const querySingle = async <T extends QueryResultRow = any>(stuff: QueryConfig) => {
  const result: QueryResult<T> = await getDbPool().query(stuff)
  return getSingle<T>(result)
}

const getSingle = <T extends QueryResultRow>(result: QueryResult<T>): T | undefined => {
  if (result.rows.length > 1) {
    throw new Error(`Unexpected number of rows: ${result.rows.length}`)
  } else if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}

export const SQL = (parts: TemplateStringsArray, ...values: any[]): QueryConfig => ({
  text: parts.reduce((prev, curr, i) => prev + "$" + i + curr),
  values,
})
