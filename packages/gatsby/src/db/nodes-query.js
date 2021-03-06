const backend = process.env.GATSBY_DB_NODES || `redux`
const lokiRunQuery = require(`./loki/nodes-query`)
const siftRunQuery = require(`../redux/run-sift`)
const lazyFields = require(`../schema/lazy-fields`)

function chooseQueryEngine(args) {
  const { queryArgs, gqlType } = args
  const { filter } = queryArgs
  if (backend === `loki` && !lazyFields.contains(filter, gqlType)) {
    return lokiRunQuery
  } else {
    return siftRunQuery
  }
}

/**
 * Runs the query over all nodes of type. It must first select the
 * appropriate query engine. Sift, or Loki. Sift is used by default,
 * or if the query includes "lazy fields", those that need to be
 * resolved before being queried. These could be either plugin fields,
 * i.e those declared by plugins during the
 * `setFieldsOnGraphQLNodeType` API, or they could be linked
 * fields. See `../redux/run-sift.js` for more.
 *
 * If the query does *not* include lazy fields, and environment
 * variable `GATSBY_DB_NODES` = `loki` then we can perform a much
 * faster pure data query using loki. See `loki/nodes-query.js` for
 * more.
 *
 * @param {Object} args. Object with:
 *
 * {Object} gqlType: built during `./build-node-types.js`
 *
 * {Object} queryArgs: The raw graphql query as a js object. E.g `{
 * filter: { fields { slug: { eq: "/somepath" } } } }`
 *
 * {Object} context: The context from the QueryJob
 *
 * {boolean} firstOnly: Whether to return the first found match, or
 * all matching result.
 *
 * @returns {promise} A promise that will eventually be resolved with
 * a collection of matching objects (even if `firstOnly` is true, in
 * which case it will be a collection of length 1 or zero)
 */
function run(args) {
  const queryFunction = chooseQueryEngine(args)

  return queryFunction(args)
}

module.exports.run = run
