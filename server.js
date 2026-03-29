require("dotenv").config();

const app = require("./app"); // backend app

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🔥 Backend running on http://localhost:${PORT}`);
});