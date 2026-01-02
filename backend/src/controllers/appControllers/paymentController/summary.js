const supabase = require('@/config/supabase');
const moment = require('moment');
const { loadSettings } = require('@/middlewares/settings');

const summary = async (req, res) => {
  try {
    let defaultType = 'month';

    const { type } = req.query;

    const settings = await loadSettings();

    if (type) {
      if (['week', 'month', 'year'].includes(type)) {
        defaultType = type;
      } else {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid type',
        });
      }
    }

    const currentDate = moment();
    let startDate = currentDate.clone().startOf(defaultType);
    let endDate = currentDate.clone().endOf(defaultType);

    // Get all payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('removed', false);

    if (error) throw error;

    const result = {
      count: payments.length,
      total: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    };

    return res.status(200).json({
      success: true,
      result,
      message: `Successfully fetched the summary of payment invoices for the last ${defaultType}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = summary;
