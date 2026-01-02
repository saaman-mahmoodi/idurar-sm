const custom = require('@/controllers/pdfController');
const supabase = require('@/config/supabase');

module.exports = downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.slice(0, 1).toUpperCase() + directory.slice(1);
    const tableName = modelName.toLowerCase() + 's';
    
    const { data: result, error } = await supabase
      .from(tableName)
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    // Throw error if no result
    if (error || !result) {
      throw { name: 'ValidationError' };
    }

    // Continue process if result is returned
    
    // Debug: Log the raw result to see the actual data structure
    console.log('Raw result from database:', JSON.stringify(result, null, 2));
    console.log('Items type:', typeof result.items);
    console.log('Items:', JSON.stringify(result.items, null, 2));
    
    // Parse items if they're stored as a string
    let items = result.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('Failed to parse items:', e);
        items = [];
      }
    }
    
    // Transform snake_case to camelCase for template compatibility
    const transformedResult = {
      ...result,
      expiredDate: result.expired_date,
      clientId: result.client_id,
      taxRate: parseFloat(result.tax_rate) || 0,
      subTotal: parseFloat(result.sub_total) || 0,
      taxTotal: parseFloat(result.tax_total) || 0,
      total: parseFloat(result.total) || 0,
      credit: parseFloat(result.credit) || 0,
      discount: parseFloat(result.discount) || 0,
      // Transform items array to ensure numeric values
      items: (items || []).map(item => ({
        ...item,
        itemName: item.itemName || item.item_name,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.price) || 0,
        total: parseFloat(item.total) || 0,
      })),
    };
    
    console.log('Transformed result:', JSON.stringify(transformedResult, null, 2));

    const fileId = modelName.toLowerCase() + '-' + result.id + '.pdf';
    const folderPath = modelName.toLowerCase();
    const targetLocation = `src/public/download/${folderPath}/${fileId}`;
    await custom.generatePdf(
      modelName,
      { filename: folderPath, format: 'A4', targetLocation },
      transformedResult,
      async () => {
        return res.download(targetLocation, (error) => {
          if (error)
            return res.status(500).json({
              success: false,
              result: null,
              message: "Couldn't find file",
              error: error.message,
            });
        });
      }
    );
  } catch (error) {
    // If error is thrown by Mongoose due to required validations
    if (error.name == 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Required fields are not supplied',
      });
    } else if (error.name == 'BSONTypeError') {
      // If error is thrown by Mongoose due to invalid ID
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Invalid ID',
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        result: null,
        error: error.message,
        message: error.message,
        controller: 'downloadPDF.js',
      });
    }
  }
};
