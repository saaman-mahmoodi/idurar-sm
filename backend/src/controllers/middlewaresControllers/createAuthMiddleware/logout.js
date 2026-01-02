const supabase = require('@/config/supabase');

const logout = async (req, res, { userModel }) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No token provided',
      });
    }

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      result: {},
      message: 'Successfully logout',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = logout;
