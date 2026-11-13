
const transporter = require("../config/email");

// Send Email Function
const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
           from: {
    name: process.env.SENDER_NAME,
    address: process.env.SENDER_EMAIL
},
            to,
            subject,
            html
        });

        console.log("Email sent successfully:", info.messageId);

        return info;

    } catch (error) {
        console.error("Email sending failed:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
