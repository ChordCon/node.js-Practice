const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// 서버와 통신
const MongoClient = require("mongodb").MongoClient;
var db;
MongoClient.connect(
  "mongodb+srv://chordpark:chord3361@cluster0.p1rfl.mongodb.net/ToDo?retryWrites=true&w=majority",

  function (error, client) {
    if (error) return console.log(error);
    db = client.db("ToDo");

    app.listen(5724, function () {
      console.log("Server is online");
    });
  }
);
// 서버와 통신

app.get("/", function (요청, 응답) {
  응답.sendFile(__dirname + "/index.html");
});

app.get("/write", function (요청, 응답) {
  응답.sendFile(__dirname + "/write.html");
});

app.post("/add", function (요청, 응답) {
  응답.send(요청.body);
  // 데이터베이스로 자료 업로드 방법
  db.collection("post").insertOne(
    { 제목: 요청.body.inputToDoTitle, 날짜: 요청.body.inputDate },
    function (에러, 결과) {
      if (에러) return console.log(에러);
      console.log(결과);
    }
  );
  console.log(요청.body);
  // 데이터베이스로 자료 업로드 방법
});
