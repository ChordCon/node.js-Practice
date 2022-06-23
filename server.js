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

// 서버에서 검색한 데이터 꺼내기
app.get("/search", function (요청, 응답) {
  var 검색조건 = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: 요청.query.value,
          path: "제목", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    { $sort: { 날짜: -1 } },
  ];

  console.log(요청.query.value);
  db.collection("post")
    .aggregate(검색조건)
    .toArray(function (에러, 결과) {
      // 가저온 자료를 ejs에 넣는 방법
      console.log(결과);
      응답.render("search.ejs", { posts: 결과 });
    });
});
// 서버에서 검색한 데이터 꺼내기

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

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// 로그인
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (요청, 응답) {
    응답.redirect("/");
  }
);

app.get("/mypage", login, function (요청, 응답) {
  응답.render("mypage.ejs", { 사용자: 요청.user });
});

function login(요청, 응답, next) {
  if (요청.user) {
    next();
  } else {
    응답.send("로그인 해주세요.");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});
// 로그인
