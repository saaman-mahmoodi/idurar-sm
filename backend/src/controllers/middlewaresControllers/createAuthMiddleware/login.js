const Joi = require('joi');
const supabase = require('@/config/supabase');

const login = async (req, res, { userModel }) => {
  const { email, password } = req.body;

  // validate
  const objectSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: true } })
      .required(),
    password: Joi.string().required(),
  });

  const { error, value } = objectSchema.validate({ email, password });
  if (error) {
    return res.status(409).json({
      success: false,
      result: null,
      error: error,
      message: 'Invalid/Missing credentials.',
      errorMessage: error.message,
    });
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        result: null,
        message: authError.message || 'Invalid credentials.',
      });
    }

    // Get admin data from database
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('removed', false)
      .single();

    if (dbError || !admin) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });
    }

    if (!admin.enabled) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is disabled, contact your account administrator',
      });
    }

    // Return success with token
    return res.status(200).json({
      success: true,
      result: {
        admin,
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
      message: 'Successfully logged in',
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

module.exports = login;
