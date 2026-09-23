require('dotenv').config();

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();

app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyService = client.verify.v2.services(
  process.env.TWILIO_VERIFY_SERVICE_SID
);

// Send OTP
app.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    const verification = await verifyService.verifications.create({
      to: mobile,
      channel: 'sms'
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      status: verification.status
    });

  } catch (error) {
    console.error('Send OTP error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});


// Verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    const verificationCheck =
      await verifyService.verificationChecks.create({
        to: mobile,
        code: otp
      });

    if (verificationCheck.status === 'approved') {
      return res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);

    res.status(400).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log(
    `OTP server running on port ${process.env.PORT || 3000}`
  );
});
