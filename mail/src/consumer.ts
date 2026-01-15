import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startsendOTPConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host,
      port: 5672,
      username: process.env.RABBITMQ_USER,
      password:  process.env.RABBITMQ_PASSWORD,
    });
    const channel = await connection.createChannel();
    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });
    channel.consume(queueName, async (msg) => {
      try {
        if (msg) {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,   
            auth: {
              user: process.env.USER,
              pass: process.env.PASSWORD,
            },
          });
          await transporter.sendMail({
            from: "chat app",
            to,
            subject,
            text: body,
          });
          console.log(`OTP MAIL SENT TO ${to}`);
          channel.ack(msg)
        }
      } catch (error) {
        console.log("failed to send the otp mail",error);
      }
    });
    console.log("Mail services consumer started listening for otp emails");
  } catch (error) {
    console.log("failed to start rabbit mq consumer", error);
  }
};
