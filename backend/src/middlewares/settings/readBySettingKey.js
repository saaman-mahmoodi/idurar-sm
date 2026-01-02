const supabase = require('@/config/supabase');

const readBySettingKey = async ({ settingKey }) => {
  try {
    if (!settingKey) {
      return null;
    }

    const { data: result, error } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single();

    if (error || !result) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
};

module.exports = readBySettingKey;
