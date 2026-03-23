# FFC Pay Web 

## Description

FFC Pay Web is a front-end microservice which allows operational users to access a variety of information about payment requests, including:
- Management of schemes
- Management of holds
- Viewing events
- Downloading reports

For how the repository fits into the architecture and what components or dependencies it interacts with please refer to the following diagram: [ffc-pay.drawio](https://github.com/DEFRA/ffc-diagrams/blob/main/Payments/ffc-pay.drawio)

## Prerequisites
### Software required

- [Docker](https://www.docker.com/)
- Either:
  - [Docker-Compose](https://docs.docker.com/compose/install/linux/#install-the-plugin-manually)
  - [Docker-Compose (standalone)](https://docs.docker.com/compose/install/other/)

Optional:
- [Kubernetes](https://kubernetes.io/)
- [Helm](https://helm.sh/)

## Configuration  
### Azure App Registration

This service has been integrated into Azure App Registration using the msal-node [npm package](https://www.npmjs.com/package/@azure/msal-node)

By default, authentication is disabled.  It can be enabled by setting the `AUTHENTICATION_ENABLED` environment variable to `true`

If authentication is enabled, this service needs to be registered with [Azure App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

The following environment varibles need to be set:

| Name                  | Description |
|-----------------------|-------------|
| AZUREID_CLIENT_ID     | The client (application) ID of an App Registration in the tenant. |
| AZUREID_TENANT_ID     | The Azure Active Directory tenant (directory) ID. |
| AZUREID_CLIENT_SECRET | A client secret that was generated for the App Registration. |

These can be retrieved from the App Registration overview blade.

### Azure App Registry roles

The following roles need [setting up](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps)

- Payment.Hold.Admin
- Payment.Scheme.Admin
- Payment.Data.View
- Payment.Closure.Admin

For users to access this service, the users need to be assigned to the relevant roles above through Azure Enterprise Applications.

## Setup

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Configuration
#### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

When using the Docker Compose files in development the local `app` folder will
be mounted on top of the `app` folder within the Docker container, hiding the CSS files that were generated during the Docker build.  For the site to render correctly locally `npm run build` must be run on the host system.


By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```
docker compose build
```

## How to start the service

The service can be ran using the convenience script:

```
./scripts/start
```

Or use Docker Compose to run service locally.

```
docker compose start
```

Additional Docker Compose files are provided for scenarios such as linking to other running services.
Link to other services:

```
docker compose -f docker-compose.yaml -f docker-compose.link.yaml up
```

> Note: This service depends on the [`ffc-pay-processing`](https://github.com/DEFRA/ffc-pay-processing) service to be able to run correctly.

## How to get output

There are several different possible outputs:

1. **To access the web front-end for the service**

**Pre-requisite:** Start the `ffc-pay-processing` service (as described in the [README.md](https://github.com/DEFRA/ffc-pay-processing/blob/main/README.md) of it's repository.

**Input:** Start this service (as described [above](#how-to-start-the-service)).

**Output:** If you then go to `localhost:3007` you should see the home screen for the Payment Management Portal's web front-end.

2. **To create a new payment hold**

**Input:** 
  - From the home screen of the web service, click on `Manage holds`.
  - Then from the Payment holds page, click on the `Create new hold` button.
  - Enter the customer's 10 digit Firm Reference Number (FRN) and select a hold category from the scheme options.
  - Click on the `Create` button at the bottom of the page.

  **Output:** A hold created will block every payment request for that customer and specified scheme. Payments for other customers are unaffected and payments for the same customer, but different schemes, are unaffected.

3. **To remove a payment hold**

**Pre-requisite:** At least one payment hold must exist already.

**Input:** 
  - From the home screen of the web service, click on `Manage holds`.
  - Then from the Payment holds page, click on `Remove` beside the hold you want to delete.

**Output:** A hold that is removed will no longer block payment requests for that customer and specified scheme.

4. **To download a payment hold report**

**Pre-requisite:** At least one payment hold must exist already.

**Input:** 
  - From the home screen of the web service, click on `Holds`.
  - This will then download a report that can be opened in Excel, for example.

**Output:** The report produced is in a `.csv` file format, containing a list of all the current holds that exist. 

5. **To download a payment request status report**

**Pre-requisite:** At least one payment request msut exist already.

**Input:** 
  - From the home screen of the web service, click on `Payment request statuses`.
  - This will then download a report that can be opened in Excel, for example.

**Output:** The report produced is in a `.csv` file format, containing a list of all the payment request's stauses and all the information tied to them.

6. **To manage a payment scheme**

**Input:** 
  - From the home screen of the web service, click on `Manage schemes`.
  - From this page you can `Disable` any of the active schemes and `Enable` any of the inactive schemes.

**Output:** Disabling a scheme will block every customer from the specified scheme and enabling a scheme will no longer block every customer from the specified scheme.

7. **To view any events**

**Pre-requisite:** To view a payment event, an event must already exist.

**Input:** 
  - From the home screen of the web service, click on `View events`.
  - Then on this page, enter the Firm Reference Number (FRN) to search or events by FRN.
  
**Output:** Events provide the business with traceability of every payment request and decision made by the service. 

## How to stop the service

The service can be stopped in different ways:
- [Bring the service down](#bring-the-service-down)
- [Bring the service down and clear its data](#bring-the-service-down-and-clear-its-data)

### Bring the service down  

```
docker compose down
```

### Bring the service down and clear its data  

```
docker compose down -v
```

## How to test the service

The tests have been structured into subfolders of `./test` as per the
[Microservice test approach and repository structure](https://eaflood.atlassian.net/wiki/spaces/FPS/pages/1845396477/Microservice+test+approach+and+repository+structure)

### Running tests

A convenience script is provided to run automated tests in a containerised
environment. This will rebuild images before running tests via docker-compose,
using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`.
The command given to `docker compose run` may be customised by passing
arguments to the test script.

Tests can be run in several modes
- [Run tests and exit](#run-tests-and-exit)
- [Run tests with file watch](#run-tests-with-file-watch)
- [Run tests with debugger attachable](#run-tests-with-debugger-attachable)

#### Run tests and exit

```
scripts/test
```

#### Run tests with file watch

```
scripts/test -w
```

#### Run tests with debugger attachable

```
scripts/test -d
```

## CI pipeline

This service uses the [FFC CI pipeline](https://github.com/DEFRA/ffc-jenkins-pipeline-library)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
