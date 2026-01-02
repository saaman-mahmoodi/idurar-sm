const supabase = require('@/config/supabase');
const { increaseBySettingKey } = require('@/middlewares/settings');
const { calculate } = require('@/helpers');

const create = async (req, res) => {
  try {
    const { items = [], taxRate = 0, discount = 0 } = req.body;

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

    let body = req.body;

    body['subTotal'] = subTotal;
    body['taxTotal'] = taxTotal;
    body['total'] = total;
    body['items'] = items;
    body['createdBy'] = req.admin.id;

    // Creating a new document in the collection
    const { data: result, error: insertError } = await supabase
      .from('quotes')
      .insert({
        removed: false,
        created_by: body.createdBy,
        number: body.number,
        year: body.year,
        content: body.content,
        date: body.date,
        expired_date: body.expiredDate,
        client_id: body.client,
        items: body.items,
        tax_rate: body.taxRate,
        sub_total: body.subTotal,
        tax_total: body.taxTotal,
        total: body.total,
        currency: body.currency,
        credit: body.credit || 0,
        discount: body.discount || 0,
        notes: body.notes,
        status: body.status || 'draft',
        approved: body.approved || false,
        is_expired: body.isExpired || false,
        files: body.files || []
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const fileId = 'quote-' + result.id + '.pdf';
    const { data: updateResult, error: updateError } = await supabase
      .from('quotes')
      .update({ pdf: fileId })
      .eq('id', result.id)
      .select()
      .single();

    if (updateError) throw updateError;

    increaseBySettingKey({
      settingKey: 'last_quote_number',
    });

    // Returning successfull response
    return res.status(200).json({
      success: true,
      result: updateResult,
      message: 'Quote created successfully',
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
