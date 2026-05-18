import net from "node:net";
import tls from "node:tls";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SmtpSocket = net.Socket | tls.TLSSocket;

function assertSafeHeader(value: string, fieldName: string) {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${fieldName} must not contain newlines.`);
  }
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^<>]+)>/);
  return (match?.[1] ?? value).trim();
}

function dotStuff(value: string) {
  return value.replace(/^\./gm, "..");
}

function createMessage(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM ?? "SportLife <no-reply@sportlife.local>";

  assertSafeHeader(from, "EMAIL_FROM");
  assertSafeHeader(input.to, "to");
  assertSafeHeader(input.subject, "subject");

  const headers = [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    input.html ? 'Content-Type: text/html; charset="UTF-8"' : 'Content-Type: text/plain; charset="UTF-8"',
  ];

  return `${headers.join("\r\n")}\r\n\r\n${dotStuff(input.html ?? input.text)}`;
}

function connectSmtp(host: string, port: number, secure: boolean): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    const readyEvent = secure ? "secureConnect" : "connect";

    socket.once(readyEvent, () => resolve(socket));
    socket.once("error", reject);
  });
}

function readResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines.at(-1);

      if (lastLine && /^\d{3} /.test(lastLine)) {
        socket.off("data", onData);
        socket.off("error", onError);
        resolve(buffer);
      }
    };

    const onError = (error: Error) => {
      socket.off("data", onData);
      reject(error);
    };

    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function command(socket: SmtpSocket, value: string, expectedCodes: number[]) {
  socket.write(`${value}\r\n`);
  const response = await readResponse(socket);
  const code = Number(response.slice(0, 3));

  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed with ${code}: ${response.trim()}`);
  }
}

async function upgradeToTls(socket: net.Socket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

async function sendSmtpEmail(input: SendEmailInput) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !user || !pass) {
    throw new Error("SMTP email provider requires SMTP_HOST, SMTP_USER, and SMTP_APP_PASSWORD.");
  }

  let socket = await connectSmtp(host, port, secure);

  try {
    await readResponse(socket);
    await command(socket, `EHLO ${host}`, [250]);

    if (!secure) {
      await command(socket, "STARTTLS", [220]);
      socket = await upgradeToTls(socket as net.Socket, host);
      await command(socket, `EHLO ${host}`, [250]);
    }

    const auth = Buffer.from(`\0${user}\0${pass}`, "utf8").toString("base64");
    await command(socket, `AUTH PLAIN ${auth}`, [235]);
    await command(socket, `MAIL FROM:<${extractEmailAddress(process.env.EMAIL_FROM ?? user)}>`, [250]);
    await command(socket, `RCPT TO:<${extractEmailAddress(input.to)}>`, [250, 251]);
    await command(socket, "DATA", [354]);
    await command(socket, `${createMessage(input)}\r\n.`, [250]);
    await command(socket, "QUIT", [221]);
  } finally {
    socket.end();
  }
}

export async function sendEmail(input: SendEmailInput) {
  if (process.env.EMAIL_PROVIDER === "smtp") {
    await sendSmtpEmail(input);
    return;
  }

  if (!process.env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER === "console") {
    console.info("[email:console]", input);
    return;
  }

  throw new Error("Selected email provider is not implemented yet.");
}
