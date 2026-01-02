const supabase = require('@/config/supabase');

const listBySettingKey = async ({ settingKeyArray = [] }) => {
  try {
    if (settingKeyArray.length === 0) {
      return [];
    }

    const { data: results, error } = await supabase
      .from('settings')
      .select('*')
      .in('setting_key', settingKeyArray)
      .eq('removed', false);

    if (error || !results) {
      return [];
    }

    return results;
  } catch {
    return [];
  }
};

module.exports = listBySettingKey;
