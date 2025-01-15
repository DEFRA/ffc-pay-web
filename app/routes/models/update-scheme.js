function viewModel (value, error) {
  this.model = {
    id: 'confirm',
    name: 'confirm',
    schemeId: `${value.schemeId}`,
    schemeName: `${value.name}`,
    active: `${value.active}`,
    fieldset: {
      legend: {
        text: getText(value.name, value.active),
        isPageHeading: true,
        classes: 'govuk-fieldset__legend--l'
      }
    },
    items: [
      {
        value: true,
        text: 'Yes'
      },
      {
        value: false,
        text: 'No'
      }
    ]
  }

  if (error) {
    this.model.errorMessage = {
      text: 'Please select yes or no to update.'
    }
  }
}

const getText = (name, active) => {
  if (active) {
    return `Would you like to disable ${name}?`
  }
  return `Would you like to enable ${name}?`
}

module.exports = viewModel
