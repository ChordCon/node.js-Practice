const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

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
  응답.render("index.ejs");
});

app.get("/write", function (요청, 응답) {
  응답.render("write.ejs");
});

// views라는 폴더를 만들고 그안에 ejs 파일을 넣어야 랜더링이됨!
app.get("/list", function (요청, 응답) {
  // 모든 데이터 가저올때
  // db.collection('post').find().toArray()
  db.collection("post")
    .find()
    .toArray(function (에러, 결과) {
      // 가저온 자료를 ejs에 넣는 방법
      응답.render("list.ejs", { posts: 결과 });
    });
});

app.post("/add", function (요청, 응답) {
  db.collection("counter").findOne(
    { name: "totalPost" },
    function (에러, 결과) {
      const totalPost = 결과.totalPost;
      // 데이터베이스로 자료 업로드 방법 + 게시물에 아이디 부여방법
      db.collection("post").insertOne(
        {
          _id: totalPost + 1,
          제목: 요청.body.inputToDoTitle,
          날짜: 요청.body.inputDate,
        },
        function (에러, 결과) {
          if (에러) return console.log(에러);

          db.collection("counter").updateOne(
            { name: "totalPost" },
            { $inc: { totalPost: 1 } },
            function (에러, 결과) {
              if (에러) return console.log(에러);
              응답.redirect("/list");
            }
          );
        }
      );
      // 데이터베이스로 자료 업로드 방법
    }
  );
});

// 클릭하면 디테일 페이지로 이동
app.delete("/delete", function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id);
  db.collection("post").deleteOne(요청.body, function (에러, 결과) {
    응답.status(200).send("성공");
  });
});

app.get("/detail/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (애러, 결과) {
      응답.render("detail.ejs", { data: 결과 });
    }
  );
});
// 클릭하면 디테일 페이지로 이동

// 글 수정
app.get("/edit/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (애러, 결과) {
      응답.render("edit.ejs", { post: 결과 });
    }
  );
});

app.put("/edit", function (요청, 응답) {
  db.collection("post").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { 제목: 요청.body.inputToDoTitle, 날짜: 요청.body.inputDate } },
    function (에러, 결과) {
      응답.redirect("/list");
    }
  );
});
// 글 수정
