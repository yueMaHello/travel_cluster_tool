/*jshint esversion: 6 */
var fs=require('fs');
var router = require('express').Router();

// The top of our dir.
var FCT_DIR = process.env.FCT_DIR;

//
function fct_read_version_data() {
  var version_path=FCT_DIR+"/public/version.txt";
  
  if (fs.existsSync(version_path)) {
    return fs.readFileSync(version_path);
  }
  return "DEV";
}
var FCT_VERSION_DATA=fct_read_version_data();

console.log("FCT_VERSION_DATA="+FCT_VERSION_DATA);

router.get('/favicon.ico', function (req, res, next) {
    ico_path=FCT_DIR+"/public/images/FCT.ico";
    console.log("favicon.ico => "+ico_path);
    res.sendFile(ico_path);
});
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Travel Flow Cluster Analysis Tool'});
});


router.get('/version.txt',function(req,res,next) {
  res.send(FCT_VERSION_DATA);
});
  
module.exports = router;
