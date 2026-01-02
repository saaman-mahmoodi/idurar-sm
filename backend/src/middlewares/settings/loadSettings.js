const listAllSettings = require('./listAllSettings');

const loadSettings = async () => {
  const allSettings = {};
  const datas = await listAllSettings();
  console.log('Raw settings from database:', JSON.stringify(datas, null, 2));
  datas.forEach(({ setting_key, setting_value, settingKey, settingValue }) => {
    // Handle both snake_case (Supabase) and camelCase (old MongoDB)
    const key = setting_key || settingKey;
    const value = setting_value || settingValue;
    if (key) {
      allSettings[key] = value;
    }
  });
  console.log('Loaded settings:', allSettings);
  return allSettings;
};

module.exports = loadSettings;
