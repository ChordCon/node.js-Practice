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

app.get("/fail", function (요청, 응답) {
  응답.render("fail.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (요청, 응답) {
    응답.redirect("/list");
  }
);

app.get("/mypage", login, function (요청, 응답) {
  if (요청.user === undefined) {
    응답.send("로그인해주세요");
  } else {
    응답.render("mypage.ejs", { 사용자: 요청.user });
  }
});

// 로그인 체크
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

app.get("/", function (요청, 응답) {
  db.collection("login");

  요청.user === undefined
    ? 응답.render("index.ejs", { 사용자: 요청.user })
    : db
        .collection("post")

        .find()
        .toArray(function (에러, 결과) {
          // 가저온 자료를 ejs에 넣는 방법
          응답.render("list.ejs", { posts: 결과, 사용자: 요청.user });
        });
});

app.get("/write", function (요청, 응답) {
  db.collection("login");
  if (요청.user === undefined) {
    응답.send("로그인해주세요");
  } else {
    응답.render("write.ejs", { 사용자: 요청.user });
  }
});

// views라는 폴더를 만들고 그안에 ejs 파일을 넣어야 랜더링이됨!
app.get("/list", function (요청, 응답) {
  db.collection("login");

  // 모든 데이터 가저올때
  // db.collection('post').find().toArray()
  if (요청.user === undefined) {
    응답.send("로그인해주세요");
  } else {
    db.collection("post")
      .find()
      .toArray(function (에러, 결과) {
        // 가저온 자료를 ejs에 넣는 방법
        응답.render("list.ejs", {
          posts: 결과,
          사용자: 요청.user,
        });
      });
  }
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

  db.collection("post")
    .aggregate(검색조건)
    .toArray(function (에러, 결과) {
      // 가저온 자료를 ejs에 넣는 방법

      응답.render("search.ejs", { posts: 결과 });
    });
});
// 서버에서 검색한 데이터 꺼내기

app.delete("/delete", function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id);
  let 삭제할데이터 = { _id: 요청.body._id, 작성자: 요청.user.id };
  db.collection("post").deleteOne(삭제할데이터, function (에러, 결과) {
    응답.status(200).send("완료");
  });
});

app.delete("/deleteChat", function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id);
  let 삭제할데이터 = { _id: 요청.body._id, 댓글작성자: 요청.user.id };
  db.collection("chat").deleteOne(삭제할데이터, function (에러, 결과) {
    응답.status(200).send("완료");
  });
});

// 클릭하면 디테일 페이지로 이동
app.get("/detail/:id", function (요청, 응답) {
  db.collection("login");
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (애러, 결과) {
      db.collection("chat")
        .find()
        .toArray(function (에러, 결과2) {
          응답.render("detail.ejs", {
            data: 결과,
            chats: 결과2,
            사용자: 요청.user,
          });
        });
    }
  );
});
// 클릭하면 디테일 페이지로 이동

// 글 수정
app.get("/edit/:id", function (요청, 응답) {
  db.collection("login");
  db.collection("post");

  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (애러, 결과) {
      if (요청.user.id !== 결과.작성자) {
        응답.send("본인이 작성한 글만 수정가능합니다.");
      } else {
        응답.render("edit.ejs", { post: 결과, 사용자: 요청.user });
      }
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

// 댓글 수정
app.get("/editComments/:id", function (요청, 응답) {
  db.collection("login");

  db.collection("chat").findOne(
    { _id: parseInt(요청.params.id) },
    function (애러, 결과) {
      응답.render("editComments.ejs", { chat: 결과, 사용자: 요청.user });
    }
  );
});

app.put("/editComments", function (요청, 응답) {
  db.collection("chat").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { 내용: 요청.body.inputChat } },
    function (에러, 결과) {
      응답.redirect(`/detail/${요청.body.댓글다는글의id}`);
    }
  );
});
// 댓글 수정

// 글 추가
app.post("/add", function (요청, 응답) {
  db.collection("login");
  db.collection("counter").findOne(
    { name: "totalPost" },
    function (에러, 결과) {
      const totalPost = 결과.totalPost;
      const inform = {
        _id: totalPost + 1,
        제목: 요청.body.inputToDoTitle,
        날짜: 요청.body.inputDate,
        상세내용: 요청.body.inputContent,
        작성자: 요청.user.id,
      };
      // 데이터베이스로 자료 업로드 방법 + 게시물에 아이디 부여방법
      db.collection("post").insertOne(inform, function (에러, 결과) {
        if (에러) return console.log(에러);

        db.collection("counter").updateOne(
          { name: "totalPost" },
          { $inc: { totalPost: 1 } },
          function (에러, 결과) {
            if (에러) return console.log(에러);

            응답.redirect("/list");
          }
        );
      });
      // 데이터베이스로 자료 업로드 방법
    }
  );
});
// 글 추가

// 회원가입
app.get("/register", function (요청, 응답) {
  응답.render("register.ejs");
});

app.post("/register", function (요청, 응답) {
  db.collection("login").findOne(
    { id: 요청.body.id },
    function (에러, 중복결과) {
      if (중복결과 === null) {
        db.collection("login").insertOne(
          { id: 요청.body.id, pw: 요청.body.pw },

          function (에러, 결과) {
            응답.render("index.ejs");
          }
        );
      } else {
        응답.send("이미 존재하는 아이디입니다.");
      }
    }
  );
});
// 회원가입

// 라우터
app.use("/shop", require("./routes/shop.js"));

app.use("/board/sub", require("./routes/board.js"));
// 라우터

// 멀터(업로드 편하게 하는거) 세팅
let multer = require("multer");
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  // filefilter : function(req, file, cb){
  //  파일 확장자 필터(ex: 이미지만 )
  // },
  // limits : function(req, file, cb) {
  //  파일 크기 리밋 설정
  // }
});

let upload = multer({ storage: storage });
// 멀터(업로드 편하게 하는거) 세팅

// 이미지 업로드
app.get("/upload", function (req, res) {
  res.render("upload.ejs");
});

app.post("/upload", upload.single("uploadImg"), function (req, res) {
  res.send("완료");
});
// 이미지 업로드

// 이미지 보여주기
// "/img/:imgName" :뒤에 부분은 유저가 주소창에 입력한 값.
app.get("/img/:imgName", function (req, res) {
  res.sendFile(__dirname + "/public/img/" + req.params.imgName + ".png");
});
// 이미지 보여주기

// 글 추가
app.post("/chat", login, function (req, res) {
  db.collection("post");
  db.collection("counter").findOne(
    { name: "totalPost" },
    function (에러, 결과) {
      const totalPost = 결과.totalPost;
      const date = new Date();

      const inform = {
        _id: totalPost + 1,
        내용: req.body.inputChat,
        작성날짜:
          date.getMonth() +
          1 +
          "월 " +
          date.getDate() +
          "일 " +
          date.getHours() +
          "시",
        댓글작성자: req.user.id,
        댓글다는글의id: req.body.글id,
        글주인: req.body.글주인,
      };

      // 데이터베이스로 자료 업로드 방법 + 게시물에 아이디 부여방법
      db.collection("chat").insertOne(inform, function (에러, 결과) {
        if (에러) return console.log(에러);

        db.collection("counter").updateOne(
          { name: "totalPost" },
          { $inc: { totalPost: 1 } },
          function (에러, 결과) {
            if (에러) return console.log(에러);

            res.redirect(`/detail/${req.body.글id}`);
          }
        );
      });
      // 데이터베이스로 자료 업로드 방법
    }
  );
});
// 글 추가
