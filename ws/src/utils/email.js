const nodemailer = require("nodemailer");

async function sendPasswordResetEmail(email, resetLink) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mauapresence@gmail.com",
        pass: "uwjisbbovlkqifke",
      },
    });
    const mailOptions = {
      from: "mauapresence@gmail.com",
      to: email,
      subject: "Redefinição de senha",
      html: `<p>Clique no link abaixo para redefinir sua senha:</p><a href="${resetLink}">${resetLink}</a>`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
};
