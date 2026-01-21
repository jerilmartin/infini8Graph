// Script to clear analytics cache so new improved data is fetched
import supabase from '../src/config/supabase.js';

async function clearCache() {
    console.log('Clearing analytics cache...');

    const { error } = await supabase
        .from('analytics_cache')
        .delete()
        .neq('id', 0); // Delete all

    if (error) {
        console.error('Error clearing cache:', error.message);
    } else {
        console.log('✅ Analytics cache cleared successfully!');
        console.log('New requests will fetch fresh data with improved metrics.');
    }

    process.exit(0);
}

clearCache();
