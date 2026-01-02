require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabase = require('./src/config/supabase');

async function testClientSearch() {
  console.log('Testing client search...\n');
  
  // Test 1: Check if clients table exists and has data
  console.log('1. Checking clients table:');
  const { data: clients, error: clientError, count } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('removed', false);
  
  if (clientError) {
    console.error('❌ Error querying clients:', clientError.message);
  } else {
    console.log(`✅ Found ${count} clients (removed=false)`);
    if (clients && clients.length > 0) {
      console.log('Sample clients:', clients.slice(0, 3).map(c => ({ id: c.id, name: c.name, enabled: c.enabled })));
    }
  }
  
  // Test 2: Check enabled clients
  console.log('\n2. Checking enabled clients:');
  const { data: enabledClients, error: enabledError, count: enabledCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('removed', false)
    .eq('enabled', true);
  
  if (enabledError) {
    console.error('❌ Error querying enabled clients:', enabledError.message);
  } else {
    console.log(`✅ Found ${enabledCount} enabled clients`);
    if (enabledClients && enabledClients.length > 0) {
      console.log('Sample enabled clients:', enabledClients.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
    }
  }
  
  // Test 3: Simulate search endpoint with empty query
  console.log('\n3. Simulating search with empty query:');
  const { data: searchResults, error: searchError } = await supabase
    .from('clients')
    .select('*')
    .eq('removed', false)
    .eq('enabled', true)
    .limit(100)
    .order('created_at', { ascending: false });
  
  if (searchError) {
    console.error('❌ Error in search:', searchError.message);
  } else {
    console.log(`✅ Search returned ${searchResults.length} results`);
    if (searchResults && searchResults.length > 0) {
      console.log('Sample results:', searchResults.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
    }
  }
  
  process.exit(0);
}

testClientSearch().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
