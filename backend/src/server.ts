import gracefulShutdown from "http-graceful-shutdown";
import cron from "node-cron";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import { sendEmailDueDate } from "./utils/sendEmailDueDate";

const server = app.listen(process.env.PORT, async () => {
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  logger.info(`Server started on port: ${process.env.PORT}`);
});

 //CRON PARA DISPARO DO EMAIL DE VENCIMENTO
cron.schedule("0 8 * * *", async () => {
  try {
    await sendEmailDueDate();
  }
  catch (error) {
    logger.error(error);
  }

});


initIO(server);
gracefulShutdown(server);
