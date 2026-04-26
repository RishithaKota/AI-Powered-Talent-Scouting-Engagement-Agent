import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 5000;

await connectDatabase(process.env.MONGODB_URI);

app.listen(port, () => {
  console.log(`AI Recruiter API listening on port ${port}`);
});
