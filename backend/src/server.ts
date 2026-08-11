import { app } from "./app.js";
import { env } from "./config/env.js";
app.listen(env.PORT, () =>
  console.log(`PropertyFlow API ready at http://localhost:${env.PORT}/api`),
);
