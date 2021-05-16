import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
const app = express();

const port = process.env.PORT || 9002;

const pusher = new Pusher({
  appId: "1204339",
  key: "4a2f9b9e2513c939a6fe",
  secret: "2dc3e0d3576bf92fa14e",
  cluster: "ap2",
  useTLS: true,
});

app.use(express.json());

const connection_uri =
  "mongodb+srv://quickdukanprod:quickdukan@bitashutosh@cluster0.5slcr.mongodb.net/vattendtest?retryWrites=true&w=majority" ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/whatsapp-mern";

mongoose.connect(connection_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

// mongoose.set("debug", true);
mongoose.connection.on("connected", function () {
  console.log("database connected");
});
// Event when there is an error connecting for database
mongoose.connection.on("error", function (err) {
  console.log(22, err);
});

mongoose.connection.once("open", () => {
  const msgCollection = mongoose.connection.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

app.get("/", (_, res) => res.status(200).send("hello world!"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) return res.status(500).send(err);
    res.status(201).send(data);
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
