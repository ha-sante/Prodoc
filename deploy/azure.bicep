param location string = resourceGroup().location
param appPlanName string = '${uniqueString(resourceGroup().id)}plan'


// CREATE A CONTAINER APP WITH THE PRODOC IMAGE
// CREATE A STORAGE ACCOUNT RESOURCE WITH PRODOC LABELLING
// CREATE A AZURE MYSQL DATABASE RESOURCE

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
 