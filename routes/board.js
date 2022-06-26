let router = require("express").Router();

// 라우트
router.get("/sports", function (req, res) {
  res.send("스포츠 게시판");
});

router.get("/game", function (req, res) {
  res.send("게임 게시판");
});

module.exports = router;
