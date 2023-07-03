param location string = resourceGroup().location
// param appPlanName string = '${uniqueString(resourceGroup().id)}plan'

// CREATE A AZURE STORAGE INSTANCE
// CREATE A AZURE MYSQL DATABASE INSTANCE
// CREATE A AZURE REDIS CACHING INSTANCE
// CREATE A AZURE CONTAINER APP INSTANCE - WITH THE PRODOC IMAGE

// az bicep build --file azure.bicep --outdir .

// APP SERVICE GROUP
// resource appServicePlan 'Microsoft.Web/serverfarms@2020-12-01' = {
//   name: appPlanName
//   location: location
//   sku: {
//     name: 'F1'
//     capacity: 1
//   }
// }

// STORAGE ACCOUNT INSTANCE
// STORAGE ACCOUNT - BLOB SERVICE
// STORAGE ACCOUNT - CONTAINER
// resource prodoc_storage_account 'Microsoft.Storage/storageAccounts@2022-09-01' = {
//   name: 'prodoc'
//   location: location
//   kind: 'StorageV2'
//   tags: {
//     channel: 'prodoc-quick-deploy'
//   }
//   sku: {
//     name: 'Standard_RAGZRS'
//   }
//   properties: {
//     accessTier: 'Hot'
//     allowBlobPublicAccess: true 
//     allowCrossTenantReplication: true
//     allowSharedKeyAccess: true
//     defaultToOAuthAuthentication: false
//     keyPolicy: {
//       keyExpirationPeriodInDays: 36525
//     }
//     publicNetworkAccess: 'Enabled'
//     supportsHttpsTrafficOnly: true
//     routingPreference:{
//       routingChoice: 'MicrosoftRouting'
//       publishMicrosoftEndpoints: true
//     }
//   }
// }
// var sasConfig = {
//   signedResourceTypes: 'sco'
//   signedPermission: 'r'
//   signedServices: 'b'
//   signedExpiry: '2123-09-25T00:00:00Z'
//   signedProtocol: 'https'
//   keyToSign: 'key2'
// }
// // output sasToken string = prodoc_storage_account.listAccountSas(prodoc_storage_account.apiVersion, sasConfig).accountSasToken

// resource prodoc_storage_account_blob_service 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
//   name: 'default'
//   parent: prodoc_storage_account
//   properties: {
//     defaultServiceVersion: 'string'
//     isVersioningEnabled: false
//   }
// }
// resource prodoc_storage_account_container 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
//   name: 'files'
//   parent: prodoc_storage_account_blob_service
//   properties: {
//     immutableStorageWithVersioning: {
//       enabled: false
//     }
//     metadata: {}
//     publicAccess: 'Blob'
//   }
// }

// MYSQL ISNTANCE
// @description('Provide a prefix for creating resource names.')
// param resourceNamePrefix string

// @description('Provide the administrator login name for the MySQL server.')
// param administratorLogin string

// @description('Provide the administrator login password for the MySQL server.')
// @secure()
// param administratorLoginPassword string

// @description('The tier of the particular SKU. High Availability is available only for GeneralPurpose and MemoryOptimized sku.')
// @allowed([
//   'Burstable'
//   'Generalpurpose'
//   'MemoryOptimized'
// ])
// param serverEdition string = 'Burstable'

// @description('Server version')
// @allowed([
//   '5.7'
//   '8.0.21'
// ])
// param version string = '8.0.21'

// @description('Availability Zone information of the server. (Leave blank for No Preference).')
// param availabilityZone string = '1'

// @description('High availability mode for a server : Disabled, SameZone, or ZoneRedundant')
// @allowed([
//   'Disabled'
//   'SameZone'
//   'ZoneRedundant'
// ])
// param haEnabled string = 'Disabled'

// @description('Availability zone of the standby server.')
// param standbyAvailabilityZone string = '2'

// param storageSizeGB int = 20
// param storageIops int = 360
// @allowed([
//   'Enabled'
//   'Disabled'
// ])
// param storageAutogrow string = 'Enabled'

// @description('The name of the sku, e.g. Standard_D32ds_v4.')
// param skuName string = 'Standard_B1ms'

// param backupRetentionDays int = 7
// @allowed([
//   'Disabled'
//   'Enabled'
// ])
// param geoRedundantBackup string = 'Disabled'
// param serverName string = '${resourceNamePrefix}-sqlserver'
// param databaseName string = '${resourceNamePrefix}-mysqldb'

// resource server 'Microsoft.DBforMySQL/flexibleServers@2021-12-01-preview' = {
//   location: location
//   name: serverName
//   sku: {
//     name: skuName
//     tier: serverEdition
//   }
//   properties: {
//     version: version
//     administratorLogin: administratorLogin
//     administratorLoginPassword: administratorLoginPassword
//     availabilityZone: availabilityZone
//     highAvailability: {
//       mode: haEnabled
//       standbyAvailabilityZone: standbyAvailabilityZone
//     }
//     storage: {
//       storageSizeGB: storageSizeGB
//       iops: storageIops
//       autoGrow: storageAutogrow
//     }
//     backup: {
//       backupRetentionDays: backupRetentionDays
//       geoRedundantBackup: geoRedundantBackup
//     }
//   }
// }
// resource database 'Microsoft.DBforMySQL/flexibleServers/databases@2021-12-01-preview' = {
//   parent: server
//   name: databaseName
//   properties: {
//     charset: 'utf8'
//     collation: 'utf8_general_ci'
//   }
// }

// // REDIS INSTANCE
resource symbolicname 'Microsoft.Cache/redis@2022-06-01' = {
  name: 'prodoc'
  location: location
  tags: {
    channel: 'prodoc-quick-deploy'
  }
  properties: {
    enableNonSslPort: false
    publicNetworkAccess: 'Enabled'
    redisVersion: 'latest'
    sku: {
      capacity: 1
      family: 'C'
      name: 'Basic'
    }
  }
}

// CONTAINER PRE-SETUP INSTANCES 
// param containerEnvironmentLabel string = 'prodoc-environments-app'
// var logAnalyticsWorkspaceName = '${containerEnvironmentLabel}-logs-workspace'
// var containerPort = 3000

// resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2020-03-01-preview' = {
//   name: logAnalyticsWorkspaceName
//   location: location
// }

// resource container_app_environment 'Microsoft.App/managedEnvironments@2022-03-01' = {
//   name: 'prodoc-apps-environment'
//   location: location
//   properties: {
//     appLogsConfiguration: {
//       destination: 'log-analytics'
//       logAnalyticsConfiguration: {
//         customerId: logAnalyticsWorkspace.properties.customerId
//         sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
//       }
//     }
//     vnetConfiguration: {
//       internal: false

//     }
//   }
// }

// CONTAINER APP INSTANCE
// resource prodoc_container_app_instance 'Microsoft.App/containerApps@2022-11-01-preview' = {
//   name: 'prodoc-app-instance'
//   location: location
//   tags: {
//     channel: 'prodoc-quick-deploy'
//   }
//   properties: {
//     configuration: {
//       ingress: {
//         allowInsecure: false
//         targetPort: 3000
//         transport: 'auto'
//         external: true
//       }
//     }
//     environmentId: container_app_environment.id
//     template: {
//       containers: [
//         {
//           env: [
//             {
//               name: 'channel'
//               value: 'azure'
//             }
//             {
//               name: 'EDITOR_PASSWORD'
//               value: 'password'
//             }
//             {
//               name: 'EDITOR_PASSWORD_SIGNING_KEY'
//               value: ''
//             }
//             {
//               name: 'POCKETBASE_DATABASE_CONNECTION_STRING'
//               value: ''
//             }
//             {
//               name: 'PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING'
//               value: ''
//             }
//             {
//               name: 'REDIS_SERVICE_URL'
//               value: ''
//             }
//             {
//               name: 'REDIS_SERVICE_REST_URL'
//               value: ''
//             }
//             {
//               name: 'REDIS_SERVICE_REST_TOKEN'
//               value: ''
//             }
//             {
//               name: 'NEXT_PUBLIC_AZURE_SERVICE_CONNECTION_STRING'
//               value: ''
//             }
//             {
//               name: 'NEXT_PUBLIC_UPLOADCARE_SERVICE_PUBLIC_KEY'
//               value: ''
//             }
//           ]
//           image: 'docker.io/prodoctech/prodoc:latest'
//           name: 'prodoc-container-instance'
//           resources: {
//             cpu: json('0.25')
//             memory: '0.5Gi'
//           }
//           probes: [
//             {
//               type: 'liveness'
//               initialDelaySeconds: 15
//               periodSeconds: 30
//               failureThreshold: 3
//               timeoutSeconds: 1
//               httpGet: {
//                 port: containerPort
//                 path: '/'
//               }
//             }
//             {
//               type: 'startup'
//               timeoutSeconds: 2
//               httpGet: {
//                 port: containerPort
//                 path: '/'
//               }
//             }
//             {
//              type: 'readiness'
//              timeoutSeconds: 3
//              failureThreshold: 3
//              httpGet: {
//                port: containerPort
//                path: '/'
//              }
//             }
//           ]
//         }
//       ]
//       scale: {
//         maxReplicas: 1
//         minReplicas: 1
//       }
//     }
//   }
// }
