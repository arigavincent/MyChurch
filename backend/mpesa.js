const axios = require('axios');
const { BRAND_NAME } = require('./branding');

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'your_consumer_key';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret';
const PASSKEY = process.env.MPESA_PASSKEY || 'your_passkey';
const BUSINESS_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback';
const ENV = process.env.MPESA_ENV || 'sandbox';

const BASE_URL = ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const auth = Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');
  const { data } = await axios.get(BASE_URL + '/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + auth }
  });
  return data.access_token;
}

async function stkPush(token, phone, amount, accountRef) {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(BUSINESS_SHORTCODE + PASSKEY + timestamp).toString('base64');

  const payload = {
    BusinessShortCode: BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: BUSINESS_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef || BRAND_NAME,
    TransactionDesc: 'Church Donation'
  };

  const { data } = await axios.post(BASE_URL + '/mpesa/stkpush/v1/processrequest', payload, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return data;
}

async function queryStatus(token, checkoutRequestId) {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(BUSINESS_SHORTCODE + PASSKEY + timestamp).toString('base64');

  const { data } = await axios.post(BASE_URL + '/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  }, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return data;
}

module.exports = { getAccessToken, stkPush, queryStatus };
