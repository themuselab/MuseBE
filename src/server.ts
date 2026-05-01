import "dotenv/config";
import { app } from "./app";
import { startWorker } from "./services/adGenerationService";

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.DISABLE_WORKER !== "true") {
    startWorker();
    console.log("Ad generation worker started");
  }
});
