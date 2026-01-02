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

    const statuses = ['draft', 'pending', 'sent', 'expired', 'declined', 'accepted'];

    // Get all quotes
    const { data: allQuotes, error: allError } = await supabase
      .from('quotes')
      .select('total, status')
      .eq('removed', false);

    if (allError) throw allError;

    const totalQuotes = {
      total: allQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
      count: allQuotes.length
    };

    // Calculate status counts
    const statusCounts = {};
    const statusTotals = {};

    allQuotes.forEach(quote => {
      statusCounts[quote.status] = (statusCounts[quote.status] || 0) + 1;
      statusTotals[quote.status] = (statusTotals[quote.status] || 0) + (quote.total || 0);
    });

    const result = [];
    
    statuses.forEach((status) => {
      const count = statusCounts[status] || 0;
      const total_amount = statusTotals[status] || 0;
      const percentage = totalQuotes.count > 0 ? Math.round((count / totalQuotes.count) * 100) : 0;
      
      result.push({
        status,
        count,
        percentage,
        total_amount,
      });
    });

    const finalResult = {
      total: totalQuotes.total,
      type: defaultType,
      performance: result,
    };

    return res.status(200).json({
      success: true,
      result: finalResult,
      message: `Successfully found all Quotations for the last ${defaultType}`,
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
