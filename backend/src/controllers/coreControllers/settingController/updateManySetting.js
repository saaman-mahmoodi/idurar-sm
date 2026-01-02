const supabase = require('@/config/supabase');

const updateManySetting = async (req, res) => {
  try {
    let settingsHasError = false;
    const { settings } = req.body;

    for (const setting of settings) {
      if (!setting.hasOwnProperty('settingKey') || !setting.hasOwnProperty('settingValue')) {
        settingsHasError = true;
        break;
      }
    }

    if (!settings || settings.length === 0) {
      return res.status(202).json({
        success: false,
        result: null,
        message: 'No settings provided ',
      });
    }
    if (settingsHasError) {
      return res.status(202).json({
        success: false,
        result: null,
        message: 'Settings provided has Error',
      });
    }

    // Update each setting individually (Supabase doesn't have bulkWrite)
    let updateCount = 0;
    for (const setting of settings) {
      const { settingKey, settingValue } = setting;
      const { error } = await supabase
        .from('settings')
        .update({ setting_value: settingValue })
        .eq('setting_key', settingKey);

      if (!error) {
        updateCount++;
      }
    }

    if (updateCount < 1) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No settings found by to update',
      });
    }

    return res.status(200).json({
      success: true,
      result: [],
      message: 'we update all settings',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = updateManySetting;
