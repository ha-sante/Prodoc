param location string = resourceGroup().location
param appPlanName string = '${uniqueString(resourceGroup().id)}plan'

// CREATE A CONTAINER APP WITH THE PRODOC IMAGE
// CREATE A AZURE AZURE STORAGE INSTANCE
// CREATE A AZURE MYSQL DATABASE INSTANCE
// CREATE A AZURE REDIS CACHING INSTANCE

resource symbolicname 'Microsoft.App/containerApps@2022-11-01-preview' = {
  name: 'prodoc-app-instance'
  location: location
  properties: {
    configuration: {
      registries: [
        {
          identity: 'string'
          passwordSecretRef: 'string'
          server: 'string'
          username: 'string'
        }
      ]
    }
    template: {
      containers: [
        {
          args: [
            'string'
          ]
          command: [
            'string'
          ]
          env: [
            {
              name: 'channel'
              value: 'azure'
            }
            {
              name: 'EDITOR_PASSWORD'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'EDITOR_PASSWORD_SIGNING_KEY'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'POCKETBASE_DATABASE_CONNECTION_STRING'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING'
              value: 'set-mysql-connection-string-to-use'
            }
            {
              name: 'REDIS_SERVICE_URL'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'REDIS_SERVICE_REST_URL'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'REDIS_SERVICE_REST_TOKEN'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'NEXT_PUBLIC_AZURE_SERVICE_CONNECTION_STRING'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'NEXT_PUBLIC_UPLOADCARE_SERVICE_PUBLIC_KEY'
              value: 'leave-empty-or-set-to-use'
            }
          ]
          // ADD PROBES
          // ADD INGERES SETTINGS (PORT 8080)
          image: 'prodoctech/prodoc:latest'
          name: 'prodoc'
          resources: {
            cpu: json('0.25')
            memory: '512Mb'
          }
        }
      ]
      revisionSuffix: 'string'
      scale: {
        maxReplicas: 10
        minReplicas: 1
      }
    }
    workloadProfileName: 'prodoc-app-instance-load-profile'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2020-12-01' = {
  name: appPlanName
  location: location
  sku: {
    name: 'F1'
    capacity: 1
  }
}

resource storageaccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
  name: '${appServicePlan.name}storage'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Premium_LRS'
  }
}

// az bicep build --file azure.bicep --outdir .
