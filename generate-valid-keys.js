const webpush = require('web-push');

// Generate proper VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('====================================');
console.log('VALID VAPID Keys Generated Successfully!');
console.log('====================================');
console.log('');
console.log('Public Key (65 bytes):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key:');
console.log(vapidKeys.privateKey);
console.log('');
console.log('Public Key Length:', vapidKeys.publicKey.length);
console.log('Private Key Length:', vapidKeys.privateKey.length);
console.log('');
console.log('Add these to your Railway environment variables:');
console.log('');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('');
console.log('====================================');
// Verify the keys are valid
try {
    webpush.setVapidDetails(
        'mailto:admin@aifoodies.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
    console.log('✅ Keys are valid and working!');
} catch (error) {
    console.log('❌ Key validation failed:', error.message);
}