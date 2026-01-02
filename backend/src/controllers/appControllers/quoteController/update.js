const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');

const update = async (req, res) => {
  try {
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

    const updateData = {
      number: req.body.number,
      year: req.body.year,
      content: req.body.content,
      date: req.body.date,
      expired_date: req.body.expiredDate,
      client_id: req.body.client,
      items: items,
      tax_rate: taxRate,
      sub_total: subTotal,
      tax_total: taxTotal,
      total: total,
      credit: req.body.credit || 0,
      discount: discount,
      notes: req.body.notes,
      status: req.body.status,
      approved: req.body.approved,
      is_expired: req.body.isExpired,
      pdf: 'quote-' + req.params.id + '.pdf',
      files: req.body.files
    };

    // Find document by id and updates with the required fields
    const { data: result, error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('removed', false)
      .select()
      .single();

    if (updateError || !result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Quote not found',
      });
    }

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
