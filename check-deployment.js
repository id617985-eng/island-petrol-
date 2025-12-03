const https = require('https');

const productionURL = 'https://ai-maine-ing-nachos-production.up.railway.app';

function checkDeployment() {
    console.log('🔍 Checking production deployment...');
    
    const req = https.get(`${productionURL}/api/health`, (res) => {
        let data = '';
        
        res.on('data', chunk => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const health = JSON.parse(data);
                console.log('✅ Production deployment is LIVE!');
                console.log('📊 Health Check Response:', health);
                console.log(`🌐 Your website is accessible at: ${productionURL}`);
            } catch (e) {
                console.log('⚠️  Website is up but API might have issues');
            }
        });
    });
    
    req.on('error', (err) => {
        console.log('❌ Production deployment check failed:', err.message);
        console.log('💡 Make sure your Railway deployment is complete');
    });
    
    req.setTimeout(10000, () => {
        console.log('⏰ Request timeout - check your deployment status');
        req.destroy();
    });
}

checkDeployment();
