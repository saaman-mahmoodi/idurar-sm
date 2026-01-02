const supabase = require('@/config/supabase');

const isValidAuthToken = async (req, res, next, { userModel }) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token, authorization denied.',
        jwtExpired: true,
      });

    // Verify token with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Token verification failed, authorization denied.',
        jwtExpired: true,
      });

    // Get admin data from database
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .eq('removed', false)
      .single();

    if (dbError || !admin)
      return res.status(401).json({
        success: false,
        result: null,
        message: "User doesn't exist, authorization denied.",
        jwtExpired: true,
      });

    if (!admin.enabled)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'User account is disabled, authorization denied.',
        jwtExpired: true,
      });

    // Attach user to request
    const reqUserName = userModel.toLowerCase();
    req[reqUserName] = admin;
    req.authUser = authUser;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
      controller: 'isValidAuthToken',
      jwtExpired: true,
    });
  }
};

module.exports = isValidAuthToken;
