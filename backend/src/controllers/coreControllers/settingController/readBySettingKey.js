const supabase = require('@/config/supabase');

// Helper to convert snake_case to camelCase
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert object keys from snake_case to camelCase
const keysToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamelCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = keysToCamelCase(obj[key]);
    return acc;
  }, {});
};

const readBySettingKey = async (req, res) => {
  try {
    const settingKey = req.params.settingKey || undefined;

    if (!settingKey) {
      return res.status(202).json({
        success: false,
        result: null,
        message: 'No settingKey provided ',
      });
    }

    const { data: result, error } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single();

    if (error || !result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this settingKey: ' + settingKey,
      });
    }

    return res.status(200).json({
      success: true,
      result: keysToCamelCase(result),
      message: 'we found this document by this settingKey: ' + settingKey,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = readBySettingKey;
