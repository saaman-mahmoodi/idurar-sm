const createSupabaseCRUDController = require('@/controllers/middlewaresControllers/createSupabaseCRUDController');
const { routesList } = require('@/models/utils');

const { globSync } = require('glob');
const path = require('path');

const pattern = './src/controllers/appControllers/*/**/';
const controllerDirectories = globSync(pattern).map((filePath) => {
  return path.basename(filePath);
});

// Map model names to table names (camelCase to snake_case)
const modelToTableMap = {
  'Client': 'clients',
  'Invoice': 'invoices',
  'Quote': 'quotes',
  'Payment': 'payments',
  'PaymentMode': 'payment_modes',
  'Taxes': 'taxes',
  'Lead': 'leads',
  'Setting': 'settings',
  'Upload': 'uploads',
  'Admin': 'admins'
};

const appControllers = () => {
  const controllers = {};
  const hasCustomControllers = [];

  controllerDirectories.forEach((controllerName) => {
    try {
      const customController = require('@/controllers/appControllers/' + controllerName);

      if (customController) {
        hasCustomControllers.push(controllerName);
        controllers[controllerName] = customController;
      }
    } catch (err) {
      throw new Error(err.message);
    }
  });

  routesList.forEach(({ modelName, controllerName }) => {
    if (!hasCustomControllers.includes(controllerName)) {
      const tableName = modelToTableMap[modelName] || modelName.toLowerCase();
      controllers[controllerName] = createSupabaseCRUDController(tableName);
    }
  });

  return controllers;
};

module.exports = appControllers();
