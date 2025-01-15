function viewModel () {
  this.model = {
    searchByFrn: searchByFrn(),
    searchByBatch: searchByBatch()
  }
}

const searchByFrn = () => {
  return {
    id: 'frn-search-input',
    name: 'frn',
    label: {
      text: 'Search for payments by Firm Reference Number (FRN)',
      classes: 'govuk-!-font-weight-bold'
    },
    hint: {
      text: 'For example, 1234567890'
    },
    input: {
      classes: 'govuk-input--width-20'
    },
    button: {
      classes: 'search-button'
    },
    inputmode: 'numeric'
  }
}

const searchByBatch = () => {
  return {
    id: 'batch-search-input',
    name: 'batch',
    label: {
      text: 'Search for payments by payment batch name',
      classes: 'govuk-!-font-weight-bold'
    },
    hint: {
      text: 'For example, SITISFI0001_AP_20230525095030.dat'
    },
    input: {
      classes: 'govuk-input--width-20'
    },
    button: {
      classes: 'search-button'
    }
  }
}

module.exports = viewModel
