import amqp from "amqplib";
let channel: amqp.Channel;
// in this channel we are fdoing queue
export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host,
      port: 5672,
      username: process.env.RABBITMQ_USER,
      password:  process.env.RABBITMQ_PASSWORD,
    });
    channel = await connection.createChannel();
    console.log("connected to rabbitmq");
  } catch (error) {
    console.log(error);
  }
};

export const pulishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    // throw new Error("channel is not initialized");
    console.log("channel is not initialized");
    return;
  }
  //   duarable will try retyr the queue if anything gets failed
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};
