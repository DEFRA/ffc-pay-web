import * as pbi from 'powerbi-client'

export function displayReport () {
  const permissions = pbi.models.Permissions.All

  const config = {
    type: 'report',
    tokenType: pbi.models.TokenType.Aad,
    accessToken: '',
    embedUrl: '',
    id: '',
    pageView: 'fitToWidth',
    permissions: permissions
  }

  const powerbi = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory)

  const miReportContainer = document.getElementById('miReportContainer')
  powerbi.embed(miReportContainer, config)

  console.log('displayReport')
}
