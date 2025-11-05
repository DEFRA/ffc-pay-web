const config = require('../../config')

const devTeamEmailSet = new Set(
  config.devTeamEmails
    .split(';')
    .map(e => e.trim().toLowerCase())
)

const approvedDomainSet = new Set(
  config.approvedEmailDomains
    .split(';')
    .map(domain => domain.trim().toLowerCase())
    .map(domain => domain.startsWith('@') ? domain : '@' + domain)
)

const isEmailBlocked = (emailAddress) => {
  const normalizedEmail = typeof emailAddress === 'string' && emailAddress.trim().toLowerCase()
  if (!normalizedEmail) {
    return true
  }

  if (devTeamEmailSet.has(normalizedEmail)) {
    return false
  }

  const atIndex = normalizedEmail.lastIndexOf('@')
  const domain = atIndex !== -1 && atIndex < normalizedEmail.length - 1
    ? normalizedEmail.substring(atIndex)
    : null
  console.log(config.approvedEmailDomains)
  return !domain || !approvedDomainSet.has(domain)
}

module.exports = {
  isEmailBlocked
}
