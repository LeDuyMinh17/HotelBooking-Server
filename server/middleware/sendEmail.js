import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (toEmail, code) => {
  const html = `
    <p>Xin chào,</p>
    <p>Mã xác minh đăng ký của bạn: <b>${code}</b></p>
    <p>Mã có hiệu lực trong 5 phút.</p>
    <p>Nếu bạn không yêu cầu mã này, bỏ qua email này.</p>
  `;
  await transporter.sendMail({
    from: `"Hotel Manager" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã xác minh đăng ký tài khoản",
    html,
  });
};
