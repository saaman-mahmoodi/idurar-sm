const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');

const update = async (req, res) => {
  try {
    let body = req.body;

    const { error, value } = schema.validate(body);
    if (error) {
      const { details } = error;
      return res.status(400).json({
        success: false,
        result: null,
        message: details[0]?.message,
      });
    }

    const { data: previousInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('credit')
      .eq('id', req.params.id)
      .eq('removed', false)
      .single();

    if (fetchError || !previousInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    const { credit } = previousInvoice;

    const { items = [], taxRate = 0, discount = 0 } = req.body;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Items cannot be empty',
      });
    }

    // default
    let subTotal = 0;
    let taxTotal = 0;
    let total = 0;

    //Calculate the items array with subTotal, total, taxTotal
    items.map((item) => {
      let total = calculate.multiply(item['quantity'], item['price']);
      //sub total
      subTotal = calculate.add(subTotal, total);
      //item total
      item['total'] = total;
    });
    taxTotal = calculate.multiply(subTotal, taxRate / 100);
    total = calculate.add(subTotal, taxTotal);

    let paymentStatus =
      calculate.sub(total, discount) === credit ? 'paid' : credit > 0 ? 'partially' : 'unpaid';

    const updateData = {
      number: body.number,
      year: body.year,
      content: body.content,
      recurring: body.recurring,
      date: body.date,
      expired_date: body.expiredDate,
      client_id: body.client,
      items: items,
      tax_rate: taxRate,
      sub_total: subTotal,
      tax_total: taxTotal,
      total: total,
      credit: body.credit !== undefined ? body.credit : credit,
      discount: discount,
      payment_status: paymentStatus,
      is_overdue: body.isOverdue,
      approved: body.approved,
      notes: body.notes,
      status: body.status,
      pdf: 'invoice-' + req.params.id + '.pdf',
      files: body.files
    };

    const { data: result, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('removed', false)
      .select()
      .single();

    if (updateError) throw updateError;

    // Returning successfull response
    return res.status(200).json({
      success: true,
      result,
      message: 'we update this document',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = update;
