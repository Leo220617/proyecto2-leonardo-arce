import amqplib from 'amqplib';

let conn, channel;

export async function mqChannel() {
  if (channel) return channel;
  conn = conn || await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(process.env.RABBITMQ_QUEUE, { durable: true });
  return channel;
}

export async function enqueueUpdate(payload) {
  const ch = await mqChannel();
  ch.sendToQueue(process.env.RABBITMQ_QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

export async function drainUpdates(handler) {
  const ch = await mqChannel();
  let count = 0;
  await ch.consume(process.env.RABBITMQ_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const body = JSON.parse(msg.content.toString());
      await handler(body);
      ch.ack(msg);
      count++;
    } catch (e) {
      ch.nack(msg, false, true); // requeue on failure
    }
  }, { noAck: false });
  // Para entorno serverless, ventana corta
  await new Promise(r => setTimeout(r, 2000));
  return count;
}
