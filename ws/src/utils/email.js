const nodemailer = require("nodemailer");

async function sendPasswordResetEmail(email, resetLink) {
  try {
    // Configurar o transporte do Nodemailer
    const transporter = nodemailer.createTransport({
      // Configurações do serviço de e-mail (por exemplo, Gmail)
      service: "gmail",
      auth: {
        user: "mauapresence@gmail.com", // Insira o e-mail remetente
        pass: "zbnmcwqslgdryfig", // Insira a senha do e-mail remetente
      },
    });

    // Configurar o e-mail
    const mailOptions = {
      from: "mauapresence@gmail.com", // E-mail remetente
      to: email, // E-mail do destinatário (usuário que solicitou a redefinição de senha)
      subject: "Redefinição de senha", // Assunto do e-mail
      text: `Clique no link abaixo para redefinir sua senha:\n${resetLink}`, // Corpo do e-mail
    };

    // Enviar o e-mail
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
};
