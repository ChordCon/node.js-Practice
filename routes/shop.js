let router = require("express").Router();

function login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인 해주세요.");
  }
}

// 아래의 라우트에 전부 적용
router.use(login);
// 특성 라우트에 적용
// router.use("/shirts", login);

// 라우트
router.get("/shirts", function (req, res) {
  res.send("셔츠 파는 페이지 입니다.");
});

router.get("/pants", function (req, res) {
  res.send("바지 팔아요.");
});

module.exports = router;
