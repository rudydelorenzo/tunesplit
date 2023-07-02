import express from "express";

const app = express();
const backendPort = process.env.PORT || 5004;

app.listen(backendPort, () => console.log(`Listening on port ${backendPort}`));

app.use(express.static("dist"));

// create a GET route
app.get("/convert", (req, res) => {
  console.log(req);
  res.send({ express: "YOUR EXPRESS BACKEND IS CONNECTED TO REACT" });
});
