const supabase = require('@/config/supabase');
const moment = require('moment');

const summary = async (Model, req, res) => {
  try {
    let defaultType = 'month';
    const { type } = req.query;

    if (type && ['week', 'month', 'year'].includes(type)) {
      defaultType = type;
    } else if (type) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid type',
      });
    }

    const currentDate = moment();
    let startDate = currentDate.clone().startOf(defaultType).toISOString();
    let endDate = currentDate.clone().endOf(defaultType).toISOString();

    // Get total clients
    const { count: totalClients, error: totalError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('removed', false)
      .eq('enabled', true);

    if (totalError) throw totalError;

    // Get new clients in the period
    const { count: totalNewClients, error: newError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('removed', false)
      .eq('enabled', true)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (newError) throw newError;

    // Get active clients (clients with invoices)
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('client_id')
      .eq('removed', false);

    if (invoiceError) throw invoiceError;

    const uniqueClientIds = [...new Set(invoices.map(inv => inv.client_id))];
    const activeClients = uniqueClientIds.length;

    const totalActiveClientsPercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    const totalNewClientsPercentage = totalClients > 0 ? (totalNewClients / totalClients) * 100 : 0;

    return res.status(200).json({
      success: true,
      result: {
        new: Math.round(totalNewClientsPercentage),
        active: Math.round(totalActiveClientsPercentage),
      },
      message: 'Successfully get summary of new clients',
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
