const fs = require('fs')
const { closureAdmin } = require('../auth/permissions')
const schema = require('./schemas/closure')
const bulkSchema = require('./schemas/bulk-closure')
const { post } = require('../api')
const { processClosureData } = require('../closure')
const { MAX_BYTES, MAX_MEGA_BYTES } = require('../constants/payload-sizes')

const ROUTES = {
  BASE: '/closure',
  ADD: '/closure/add',
  BULK: '/closure/bulk'
}

const VIEWS = {
  ADD: 'closure/add',
  BULK: 'closure/bulk'
}

const HTTP = {
  BAD_REQUEST: 400
}

module.exports = [
  {
    method: 'GET',
    path: ROUTES.ADD,
    options: {
      auth: { scope: [closureAdmin] },
      handler: async (_request, h) => {
        return h.view(VIEWS.ADD)
      }
    }
  },
  {
    method: 'GET',
    path: ROUTES.BULK,
    options: {
      auth: { scope: [closureAdmin] },
      handler: async (_request, h) => {
        return h.view(VIEWS.BULK)
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.ADD,
    options: {
      auth: { scope: [closureAdmin] },
      validate: {
        payload: schema,
        failAction: async (request, h, error) => {
          return h
            .view(VIEWS.ADD, {
              errors: error,
              frn: request.payload.frn,
              agreement: request.payload.agreement,
              day: request.payload.day,
              month: request.payload.month,
              year: request.payload.year
            })
            .code(HTTP.BAD_REQUEST)
            .takeover()
        }
      },
      handler: async (request, h) => {
        let day = request.payload.day.toString()
        if (day.length !== 2) {
          day = `0${request.payload.day}`
        }
        let month = request.payload.month.toString()
        if (month.length !== 2) {
          month = `0${request.payload.month}`
        }
        const date = `${request.payload.year}-${month}-${day}T00:00:00`
        await post(
          ROUTES.ADD,
          {
            frn: request.payload.frn,
            agreement: request.payload.agreement,
            date
          },
          null
        )
        return h.redirect(ROUTES.BASE)
      }
    }
  },
  {
    method: 'POST',
    path: ROUTES.BULK,
    handler: async (request, h) => {
      const data = fs.readFileSync(request.payload.file.path, 'utf8')
      if (!data) {
        return h
          .view(VIEWS.BULK, {
            errors: {
              details: [
                { message: 'An error occurred whilst reading the file' }
              ]
            }
          })
          .code(HTTP.BAD_REQUEST)
          .takeover()
      }
      const { uploadData, errors } = await processClosureData(data)
      if (errors) {
        return h.view(VIEWS.BULK, { errors }).code(HTTP.BAD_REQUEST).takeover()
      }
      await post(ROUTES.BULK, { data: uploadData }, null)
      return h.redirect(ROUTES.BASE)
    },
    options: {
      auth: { scope: [closureAdmin] },
      validate: {
        payload: bulkSchema,
        failAction: async (request, h, error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb

          return h
            .view(VIEWS.BULK, { errors: error, crumb })
            .code(HTTP.BAD_REQUEST)
            .takeover()
        }
      },
      payload: {
        output: 'file',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: MAX_BYTES,
        multipart: true,
        failAction: async (request, h, error) => {
          const crumb = request.payload?.crumb ?? request.state.crumb

          return h
            .view(VIEWS.BULK, { errors: { details: [{ message: `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.` }] }, crumb })
            .code(HTTP.BAD_REQUEST)
            .takeover()
        }

      }
    }
  }
]
