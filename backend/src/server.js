require('module-alias/register');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your node.js version at least 20 or greater. 👌\n ');
  process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const startServer = async () => {
  try {
    // Initialize Supabase connection
    const supabase = require('./config/supabase');
    
    // Test Supabase connection
    const { data, error } = await supabase.from('admins').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase Connection Failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Supabase Connected Successfully');
    
    // Start our app!
    const app = require('./app');
    app.set('port', process.env.PORT || 8888);
    const server = app.listen(app.get('port'), () => {
      console.log(`Express running → On PORT : ${server.address().port}`);
    });
  } catch (error) {
    console.error('❌ Server Startup Failed:', error.message);
    process.exit(1);
  }
};

startServer();
