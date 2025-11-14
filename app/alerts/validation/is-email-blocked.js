const config = require('../../config')

const approvedDomainSet = new Set(
  config.approvedEmailDomains
    .split(';')
    .map(domain => domain.trim().toLowerCase())
    .map(domain => domain.startsWith('@') ? domain : '@' + domain)
)

const isEmailBlocked = (emailAddress) => {
  const normalizedEmail = typeof emailAddress === 'string' && emailAddress.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.')
  }

  const atIndex = normalizedEmail.lastIndexOf('@')
  const domain = atIndex !== -1 && atIndex < normalizedEmail.length - 1
    ? normalizedEmail.substring(atIndex)
    : null

  if (!domain || !approvedDomainSet.has(domain)) {
    throw new Error('The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.')
  }
}

module.exports = {
  isEmailBlocked
}
