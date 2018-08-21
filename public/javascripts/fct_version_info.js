//
// Flow_Cluster_Tool/public/javascripts/version_info.js ---
//
// Update the version_info element.

function fct_version_info_update () {
  // grab the version info and put it on the page.
  var fct_version_info_elem=$('#fct_version_info');

  fct_version_info_elem.text("loading");

  $.get("version.txt")
    .done(function (version_data) {
      console.log("version_data=",version_data);
      fct_version_info_elem.text(version_data);
    })
  .fail(function () {
    fct_version_info_elem.html("ERROR");
  });
}
  
// Run on load.
$(document).ready(function () {
  console.log("document ready");
  fct_version_info_update();
});
