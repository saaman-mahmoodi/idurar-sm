const supabase = require('@/config/supabase');
const moment = require('moment');
const { loadSettings } = require('@/middlewares/settings');

const summary = async (req, res) => {
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

  try {
    const statuses = ['draft', 'pending', 'overdue', 'paid', 'unpaid', 'partially'];

    // Get all invoices
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('total, status, payment_status, expired_date, credit')
      .eq('removed', false);

    if (allError) throw allError;

    const totalInvoices = {
      total: allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      count: allInvoices.length
    };

    // Calculate status counts
    const statusCounts = {};
    const paymentStatusCounts = {};
    const overdueCounts = {};

    allInvoices.forEach(invoice => {
      // Status counts
      statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
      
      // Payment status counts
      paymentStatusCounts[invoice.payment_status] = (paymentStatusCounts[invoice.payment_status] || 0) + 1;
      
      // Overdue counts
      if (invoice.expired_date && new Date(invoice.expired_date) < new Date()) {
        overdueCounts['overdue'] = (overdueCounts['overdue'] || 0) + 1;
      }
    });

    const statusResult = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalInvoices.count) * 100)
    }));

    const paymentStatusResult = Object.entries(paymentStatusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalInvoices.count) * 100)
    }));

    const overdueResult = Object.entries(overdueCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalInvoices.count) * 100)
    }));

    let result = [];
    statuses.forEach((status) => {
      const found = [...paymentStatusResult, ...statusResult, ...overdueResult].find(
        (item) => item.status === status
      );
      if (found) {
        result.push(found);
      }
    });

    // Calculate unpaid total
    const { data: unpaidInvoices, error: unpaidError } = await supabase
      .from('invoices')
      .select('total, credit')
      .eq('removed', false)
      .in('payment_status', ['unpaid', 'partially']);

    if (unpaidError) throw unpaidError;

    const total_undue = unpaidInvoices.reduce((sum, inv) => 
      sum + ((inv.total || 0) - (inv.credit || 0)), 0
    );

    const finalResult = {
      total: totalInvoices.total,
      total_undue,
      type,
      performance: result,
    };

    return res.status(200).json({
      success: true,
      result: finalResult,
      message: `Successfully found all invoices for the last ${defaultType}`,
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
