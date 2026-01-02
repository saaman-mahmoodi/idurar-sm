const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
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

    const { items = [], taxRate = 0, discount = 0 } = value;

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

    body['subTotal'] = subTotal;
    body['taxTotal'] = taxTotal;
    body['total'] = total;
    body['items'] = items;

    let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

    body['paymentStatus'] = paymentStatus;
    body['createdBy'] = req.admin.id;

    // Creating a new document in the collection
    const { data: result, error: insertError } = await supabase
      .from('invoices')
      .insert({
        removed: false,
        created_by: body.createdBy,
        number: body.number,
        year: body.year,
        content: body.content,
        recurring: body.recurring,
        date: body.date,
        expired_date: body.expiredDate,
        client_id: body.client,
        converted_from: body.convertedFrom,
        converted_quote_id: body.convertedQuote,
        items: body.items,
        tax_rate: body.taxRate,
        sub_total: body.subTotal,
        tax_total: body.taxTotal,
        total: body.total,
        currency: body.currency,
        credit: body.credit || 0,
        discount: body.discount || 0,
        payment_status: body.paymentStatus,
        is_overdue: body.isOverdue || false,
        approved: body.approved || false,
        notes: body.notes,
        status: body.status || 'draft',
        files: body.files || []
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const fileId = 'invoice-' + result.id + '.pdf';
    const { data: updateResult, error: updateError } = await supabase
      .from('invoices')
      .update({ pdf: fileId })
      .eq('id', result.id)
      .select()
      .single();

    if (updateError) throw updateError;

    increaseBySettingKey({
      settingKey: 'last_invoice_number',
    });

    // Returning successfull response
    return res.status(200).json({
      success: true,
      result: updateResult,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = create;
