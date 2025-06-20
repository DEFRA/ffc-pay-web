const cheerio = require('cheerio')

/**
 * Make an initial request to get crumbs (CSRF tokens) so that subsequent
 * requests are valid.
 *
 * @param {function} mockForCrumbs include all mocks as a callback function
 * required for the request to `url`.
 * @param {object} server Hapi server to inject request.
 * @param {string} url for initial request to get crumbs from.
 * @returns {object} object contain crumbs for view and cookie.
 */
module.exports = async (mockForCrumbs, server, url, auth, method = 'GET') => {
  mockForCrumbs()
  const initRes = await server.inject({ method, url, auth })
  const initHeader = initRes.headers['set-cookie']

  const $ = cheerio.load(initRes.payload)
  const viewCrumb = $('input[name=crumb]').val()
  const cookieCrumb = initHeader?.[0]?.match(/crumb=([^",;\\\x7F]*)/)?.[1]

  if (!viewCrumb || !cookieCrumb) {
    throw Error('Either or both cookie or view crumbs were not found. Check any required mocks were setup correctly.')
  }
  return {
    cookieCrumb,
    viewCrumb
  }
}
