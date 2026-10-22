
async function sendEmail({ to, subject, htmlContent, textContent }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "FitNect";

    if (!apiKey || !senderEmail) {
        throw new Error("Brevo email configuration is missing");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": apiKey,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: senderName,
                email: senderEmail
            },
            to: [{ email: to }],
            subject,
            htmlContent,
            textContent
        }),
        signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Brevo API error (${response.status}): ${details}`);
    }

    return response.json();
}

async function sendWelcomeEmail(user) {
    return sendEmail({
        to: user.email,
        subject: "Welcome to FitNect!",
        htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Welcome to FitNect, ${escapeHtml(user.name)}!</h2>
                <p>Your account has been created successfully.</p>
                <p>Your account role is <strong>${escapeHtml(user.role)}</strong>.</p>
                <p>We're excited to support your fitness and recovery journey.</p>
                <p>— Team FitNect</p>
            </div>
        `,
        textContent:
            `Welcome to FitNect, ${user.name}! ` +
            `Your ${user.role} account has been created successfully.`
    });
}

async function sendLoginAlert(user) {
    return sendEmail({
        to: user.email,
        subject: "New sign-in to your FitNect account",
        htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Hello ${escapeHtml(user.name)},</h2>
                <p>Your FitNect account was just used to sign in.</p>
                <p>If this was you, no action is needed.</p>
                <p>If you don't recognize this activity, change your password
                   and contact FitNect support.</p>
                <p>— Team FitNect</p>
            </div>
        `,
        textContent:
            `Hello ${user.name}, your FitNect account was just used to sign in. ` +
            `If this wasn't you, secure your account.`
    });
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


async function sendOTPEmail({ email, name, otp }) {
    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.BREVO_SENDER_NAME || "FitNect",
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [{ email }],
                subject: "Verify your FitNect email",
                textContent:
                    `Hi ${name || "there"}, your FitNect verification code is ${otp}. ` +
                    "It expires in 10 minutes. Do not share this code with anyone."
            }),
            signal: AbortSignal.timeout(10000)
        }
    );

    if (!response.ok) {
        const details = await response.text();
        console.error("Brevo OTP email failed:", response.status, details);
        throw new Error("Could not send verification email.");
    }
}


async function sendPasswordResetEmail(user, resetUrl) {
    return sendEmail({
        to: user.email,
        subject: "Reset your FitNect password",
        htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Password reset request</h2>
                <p>Hello ${escapeHtml(user.name)},</p>
                <p>We received a request to reset your FitNect password.</p>
                <p>
                    <a href="${escapeHtml(resetUrl)}"
                       style="display:inline-block;padding:12px 20px;
                       background:#2563eb;color:#fff;text-decoration:none;
                       border-radius:6px">
                        Reset password
                    </a>
                </p>
                <p>This link expires in 15 minutes and can only be used once.</p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>— Team FitNect</p>
            </div>
        `,
        textContent:
            `Hello ${user.name}, reset your FitNect password using this link: ` +
            `${resetUrl}. The link expires in 15 minutes and can only be used once.`
    });
}

async function sendPasswordChangedEmail(user) {
    return sendEmail({
        to: user.email,
        subject: "Your FitNect password was changed",
        htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2>Password changed</h2>
                <p>Hello ${escapeHtml(user.name)},</p>
                <p>Your FitNect password has been changed.</p>
                <p>If you did not make this change, contact FitNect support
                   and secure your account.</p>
                <p>— Team FitNect</p>
            </div>
        `,
        textContent:
            `Hello ${user.name}, your FitNect password has been changed. ` +
            `If you did not make this change, contact FitNect support.`
    });
}



module.exports = {
    sendWelcomeEmail,
    sendLoginAlert,
    sendOTPEmail,
    sendPasswordResetEmail,
    sendPasswordChangedEmail
    
};
