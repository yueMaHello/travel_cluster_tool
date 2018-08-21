/*jshint esversion: 6 */
var map;
var currentIteration = 1;
var result;
var clusterNumber=50;
var defaultClusterNumber = 50;
var newCentroid;
var transitArray=[];
var clusters = [];
var transitArrayWithClusters = [];
var myVar;
var myCounter;
var selectedMatrix;
var ratio;
var viewSpatialReference; 
var geoSpatialReference;
var mapSpatialReference;
var geoJsonLayer1 ;
var graphicsLayer;
var startEndLayer;
var totalWeight;
var sumOfTransitArray;
var transitLen;
var transitAngle;
var travelMatrix={};
var selectedDistrict='all';
var connections = []
require([  "esri/geometry/projection","esri/map", "esri/Color", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Polyline", "esri/geometry/Polygon", "../externalJS/DirectionalLineSymbol.js","esri/layers/FeatureLayer","../externalJS/geojsonlayer.js",
        "esri/symbols/SimpleMarkerSymbol",  "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/toolbars/draw", "esri/SpatialReference","esri/config", "esri/request",
        "dojo/ready", "dojo/dom", "dojo/on","esri/dijit/BasemapToggle","esri/dijit/Scalebar","esri/geometry/Point","esri/InfoTemplate",   "esri/geometry/Extent"],
    function (projection,Map, Color, GraphicsLayer, Graphic, Polyline, Polygon, DirectionalLineSymbol,FeatureLayer,GeojsonLayer,
              SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Draw,SpatialReference, config, request,
              ready, dom, on,BasemapToggle,Scalebar,Point,InfoTemplate,Extent) {
        ready(function () {
             if (!projection.isSupported()) {
               alert("client-side projection is not supported");
               return;
             }
            const projectionPromise = projection.load();
            viewSpatialReference = new SpatialReference({
              wkid: 4326
            });
            geoSpatialReference = new SpatialReference({
              wkid: 3776
            });
            mapSpatialReference = new SpatialReference({
                wkid: 3857
            });

            $("#clusters").val(clusterNumber);
            $("#currentIteration").prop('disabled', true);
            $("#flowTable tr").remove();
            // $('#district tr').remove();
            $("#flowTable").append('<tr><th>Travel Type Selction</th></tr>');
            // $('#district').append('<tr><th>District Selection</th></tr>');

            d3.csv("./data/Origin_Dest_Zones_by_Trip_Purpose.csv", function(data) {

              var uniqueTravelType = data.map(data => data.Purpose_Category)
                .filter((value, index, self) => self.indexOf(value) === index);
              var unqiueDistrictType = data.map(data => data.DestZoneDistrictTAZ1669EETP)
                  .filter((value, index, self) => self.indexOf(value) === index);
              splitDataIntoTravelMatrix(uniqueTravelType,data); 
              // 
              // unqiueDistrictType.forEach(function(key){
              //       $("#districtTable").append('<tr class="clickableRow3"><td>'+key+'</td></tr>');
              //   });

              uniqueTravelType.forEach(function(key){
                    $("#flowTable").append('<tr class="clickableRow2"><td>'+key+'</td></tr>');
                });
                    
                $(".clickableRow2").on("click", function() {
                  $("#flowTable tr").removeClass("selected");
                  var rowItem = $(this).children('td').map(function () {
                      return this.innerHTML;
                  }).toArray();
                  $(this).addClass("selected");
                  
                  selectedMatrix=rowItem[0];
                  $("#clusters").val(defaultClusterNumber);
                  clusterNumber = defaultClusterNumber;
                  $('#currentIteration').val(0);
                  processData(selectedMatrix,clusterNumber,1);
              });
            });
            //range slider
            $("#myRange").change(function(){
              $("#clusters").val(this.value);
            });
            $("#threadRange").change(function(){
              $("#threadNumber").val(this.value);
            });
            map = new Map("map", {
                center: [-113.4947, 53.5437],
                zoom: 10,
                basemap: "gray",
                minZoom: 3
            });
            var toggle = new BasemapToggle({
               map: map,
               basemap: "streets"
             }, "viewDiv");
            toggle.startup();
            // var travelZoneLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=8gOmRemAl8guD3WA_rfLwe50SgsEvaZzIcXIraH9xC3NQPCLraLwcHIkz3osWU-SHUdSKO1N6rCnWDF_CzWLFlFFUCeugETS44f409SsCtX9eC-HoX0dkXZj2vQD1SsboTGNgAzLDtG-BfIv0FnlWBNqq84hC5a6e7lj2Tt1oV8V0WxGiCE7rtaXgxZr18TZur-l_T6gWW2jDh1mt5q0mqty8vc133DvOtg5JhtGm8OTdn9rYtscRKu66B153RYB",{
            //     mode: FeatureLayer.MODE_SNAPSHOT,
            //     outFields: ["*"],
            //     // infoTemplate: template
            // });
            // //LRT layer
            // var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0?token=8ulK33e1cubPoKiLq5MxH9EpaN_wuyYRrMTiwsYkGKnPgYFbII8tkvV5i9Dk6tz2jVqY-_Zx-0-GXY3DeSVbtpo0NlLxEjFuPwpccMNBTGZwZsVYNrqBui-6DhEyve8rnD3qGPg_2pun9hFotDWSmlWAQn41B_Sop7pr9KLSS64H_CiMRPW0GZ9Bn6gPWkR8d0CZQ6fUoctmBUJp4gvRdf6vroPETCE9zJ2OFUdPto1Xm2pxvDc7Y5mDPT_ZOXbi",{
            //     mode: FeatureLayer.MODE_SNAPSHOT,
            //     outFields: ["*"],
            // });
            map.on("load", function () {
              geoJsonLayer1 = new GeojsonLayer({
                 url:"../data/geoInfo/district1669.geojson",
                  id:"geoJsonLayer"
             });
             geoJsonLayer1.setInfoTemplate(false);
             map.addLayer(geoJsonLayer1);
             

            });
            
            $('input:radio[name=allOrDistrict]').change(function() {
              if(this.value==='all'){
                dojo.forEach(connections,dojo.disconnect);
                selectedDistrict = 'all';
              }
              else{
                connections.push(dojo.connect(geoJsonLayer1, 'onClick', MouseClickhighlightGraphic));

                

              }
            });
            function MouseClickhighlightGraphic(evt){
            
              selectedDistrict=evt.graphic.attributes.District;
              geoJsonLayer1.setInfoTemplate(true);
              processData(selectedMatrix,clusterNumber,1);
              $("#currentIteration").val("0")
              
              
            }
            
            on(map, "update-start", showLoading);
            on(map, "update-end", hideLoading);
            function showLoading() {
              map.disableMapNavigation();
              map.hideZoomSlider();
            }
            function hideLoading(error) {
              map.enableMapNavigation();
              map.showZoomSlider();
            }
            
            graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
            startEndLayer = new GraphicsLayer({ id: "startEndLayer" });
            myCounter = new Variable(0,function(){
              if($('#currentIteration').val()<200){
                result = splitIntoGroups();
              }
              else{
                $("#nextIteration").prop('disabled', false);
                $("#RerunButton").prop('disabled', false);
                $("#autoRun").prop('disabled', false);
                $("#WantJson").prop('disabled', false);
                map.enableMapNavigation();
                map.showZoomSlider();
                $("#autoRun").click();
              }
            });
            myVar = new Variable(10, function(){
                  map.removeLayer(graphicsLayer);
                  map.removeLayer(startEndLayer);
                  graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
                  map.addLayer(graphicsLayer);
                  graphicsLayer.on("click",function(evt){

                    var clickedGroup = evt.graphic.attributes.indexOfGroup;
                    if(typeof(clickedGroup)!=="undefined"){
                      map.removeLayer(startEndLayer);

                        startEndLayer = new GraphicsLayer({ id: "startEndLayer" });
                      if($("#dots").is(':checked') === true){
                        for (var h =0;h<transitArrayWithClusters[clickedGroup].length;h++){
                          var orginDest = startEndDots(transitArrayWithClusters[clickedGroup][h]);
                          startEndLayer.add(orginDest[0]);
                          if(orginDest[1]!==null){
                              startEndLayer.add(orginDest[1]);

                          }
                        }
                      }
                      else if($("#lines").is(':checked') === true){
                        for (var h2 =0;h2<transitArrayWithClusters[clickedGroup].length;h2++){
                          var line = transitArrayWithClusters[clickedGroup][h2];
                          var ag = startEndLines(line);
                          console.log(ag)
                          if(ag !== null){
                            startEndLayer.add(ag);
                          }
                        }
  
                       }
                       else{
                         alert("Some error happens, please try to refresh the page!");
                       }
                      map.addLayer(startEndLayer);
                      
                      $("#dataTable tr").remove();
                      $("#dataTable").append('<tr><th onclick="sortTable(0,dataTable)">Origin Zone    </th><th onclick="sortTable(1,dataTable)">Destination Zone   </th><th onclick="sortTable(2,dataTable)">Value</th></tr>');
    
                      for (var u =0;u<transitArrayWithClusters[clickedGroup].length;u++){
                        if(transitArrayWithClusters[clickedGroup][u][4]/ratio>=0.05){
                          $("#dataTable").append('<tr class="clickableRow"><td>'+transitArrayWithClusters[clickedGroup][u][5]+'</td><td>'+transitArrayWithClusters[clickedGroup][u][6]+'</td><td>'+transitArrayWithClusters[clickedGroup][u][4]+'</td></tr>');
                        }
                      }
                      if($("#lines").is(':checked') === true){
                        $(".clickableRow").on("click", function() {
                          $("#dataTable tr").removeClass("selected");
                          var rowItems = $(this).children('td').map(function () {
                              return this.innerHTML;
                          }).toArray();
                          $(this).addClass('selected');
                          for(var p=0,m =startEndLayer.graphics.length;p<m;p++){

                                if(startEndLayer.graphics[p].attributes.inZone === rowItems[0] &&startEndLayer.graphics[p].attributes.outZone ===rowItems[1] ){
                                    startEndLayer.graphics[p].symbol.setColor(new Color([22, 254, 18  ]));
                                    if(rowItems[0]===rowItems[1]){

                                        startEndLayer.graphics[p].symbol.outline.setColor(new Color([22, 254, 18  ]));

                                    }
                                }
                                else{
                                    if(typeof(startEndLayer.graphics[p].attributes.inZone)==="undefined"){
                                        continue;
                                    }
                                  startEndLayer.graphics[p].symbol.setColor(new Color([0,0,204]));

                                  if(startEndLayer.graphics[p].attributes.inZone === startEndLayer.graphics[p].attributes.outZone){
                                      startEndLayer.graphics[p].symbol.outline.setColor(new Color([0,0,204]));
                                  }
                                }
                          }
                          startEndLayer.refresh();

                        });
                      }
                  }
                });
    
                  //example using a picture marker symbol.
                if(myVar.GetValue() === 1){
                    currentIteration = Number($('#currentIteration').val())+1;
                    $('#currentIteration').val(currentIteration);
                }

                  //add a polyline with 3 paths
                  redrawClusters(newCentroid,graphicsLayer);

                  if($("#autoRun").is(':checked') === true){
                    myCounter.SetValue(1);
                  }
                  else{
                    $("#nextIteration").prop('disabled', false);
                    $("#RerunButton").prop('disabled', false);
                    $("#autoRun").prop('disabled', false);
                    $("#WantJson").prop('disabled', false);
                    map.enableMapNavigation();
                    map.showZoomSlider();    
                  }
            });
            $("#nextIteration").click(function(){
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              map.disableMapNavigation();
              map.hideZoomSlider();
              result = splitIntoGroups();
              // newCentroid = findNewCentroid(result);
            });
            $("#autoRun").click(function(e, parameters) {
                
                if($("#autoRun").is(':checked')){
                  $("#nextIteration").prop('disabled', true);
                  $("#RerunButton").prop('disabled', true);
                  $("#WantJson").prop('disabled', true);

                  map.disableMapNavigation();
                  map.hideZoomSlider();
                  result = splitIntoGroups();
                }
            });

            $("#WantJson").click(function(){
              var outputGeoJsonFile = outputGeojson(newCentroid);
              var data = JSON.stringify(outputGeoJsonFile,undefined,4);
              var blob = new Blob([data], {type: 'text/json'}),
                  a    = document.createElement('a');
              a.download = "geojson1.geojson";
              a.href = window.URL.createObjectURL(blob);
              a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
              a.innerHTML = 'Download JSON';
              a.click();
            });
            $("#RerunButton").click(function(){
                $("#currentIteration").val("0");
                $("#nextIteration").prop('disabled', true);
                $("#RerunButton").prop('disabled', true);
                $("#autoRun").prop('disabled', true);
                $("#WantJson").prop('disabled', true);
                map.disableMapNavigation();
                map.hideZoomSlider();
               if(Number($("#clusters").val())>0){
                 clusterNumber =Number($("#clusters").val());

                   newCentroid = new Array(clusterNumber);
                   for(var i2 = 0;i2<clusterNumber;i2++){
                       var randomWeight = Math.floor(Math.random()*(totalWeight));
                       for (var i3=0,l = transitArray.length;i3<l;i3++){
                           if(sumOfTransitArray[i3]>=randomWeight && newCentroid.indexOf(transitArray[i3])< 0) {
                               newCentroid[i2] = transitArray[i3];
                               break;
                           }
                       }
                   }

                 result = splitIntoGroups();
               }
             else{
               alert("Please enter a number!");
             }
            });

            function processData(selectedMatrix,clusterNumber,iteration) {
              console.log(selectedDistrict)
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              
              if(selectedDistrict==='all'){
                totalWeight=0;
                transitArray = travelMatrix[selectedMatrix];
                for(var i = 0, l = transitArray.length; i<l;i++){
                  totalWeight += transitArray[i][4];
                }
              }
              else{
                totalWeight=0;
                transitArray = [];
                for(var d in travelMatrix[selectedMatrix]){
            
                  if(Number(travelMatrix[selectedMatrix][d][8]) === Number(selectedDistrict)){
                    transitArray.push(travelMatrix[selectedMatrix][d]);
                  }
                }
                console.log(transitArray)
                for(var i = 0, l = transitArray.length; i<l;i++){
                  totalWeight += transitArray[i][4];
                }
              }

          
    
              //initialization
              var totalTransitLength = transitArray.length;

              var currentSum = 0;
              sumOfTransitArray = new Array(transitArray.length);
              for(var r = 0;r<totalTransitLength;r++){
                currentSum+=transitArray[r][4];
                sumOfTransitArray[r] = currentSum;
              }
              newCentroid= new Array(clusterNumber);
              for(var i2 = 0;i2<clusterNumber;i2++){
                  var randomWeight = Math.floor(Math.random()*(totalWeight));
                  for (var i3=0;i3<totalTransitLength;i3++){
                      if(sumOfTransitArray[i3]>=randomWeight && newCentroid.indexOf(transitArray[i3])< 0) {
                          newCentroid[i2] = transitArray[i3];
                          break;
                      }
                  }

              }
              if(transitArray.length>0){
                  result = splitIntoGroups();
              }
            
              }
        });

        function splitIntoGroups(){
  
          transitArrayWithClusters=[];
          for(var m=0,l=newCentroid.length;m<l;m++){
            transitArrayWithClusters[JSON.stringify(m)] = [];
          }
          var num_threads = Number($("#threadNumber").val());
          var c = 0;
          var MT = new Multithread(num_threads);
          
          var funcInADifferentThread = MT.process(
            function(newCentroid,transitArray,index){
    
              var result = new Array(transitArray.length);


              for(var i=0,l1=transitArray.length;i<l1;i++){

                var group = 0;
                var minDist =  Number.POSITIVE_INFINITY;
                for(var j = 0,l2=newCentroid.length;j<l2;j++){
                  // coordinate distance
                  var currentDist=Math.sqrt(
                      (transitArray[i][0]-newCentroid[j][0])*(transitArray[i][0]-newCentroid[j][0]) +
                      (transitArray[i][1]-newCentroid[j][1])*(transitArray[i][1]-newCentroid[j][1]) +
                      (transitArray[i][2]-newCentroid[j][2])*(transitArray[i][2]-newCentroid[j][2]) +
                      (transitArray[i][3]-newCentroid[j][3])*(transitArray[i][3]-newCentroid[j][3]) );
      
                  if(minDist>currentDist){
                    group = j;
                    minDist = currentDist;
                  }
                }

                result[i] =group;
              }

              return [index,result];
            },
            function(r) {
              c+=1;
              for(var t4=0;t4<GroupArray[r[0]].length;t4++){
                transitArrayWithClusters[JSON.stringify(r[1][t4])].push(GroupArray[r[0]][t4]);
              }
              if(c=== num_threads){
                  newCentroid = findNewCentroid(transitArrayWithClusters);
                  myVar.SetValue(1);
              }
            }
          );

          var averageLength = transitArray.length/num_threads;
          var GroupArray = new Array(num_threads);

          for(var i = 0; i<num_threads; i++){
            GroupArray[i] = transitArray.slice(averageLength*i,averageLength*(i+1));

          }
          for(var j=0; j<num_threads;j++){
             funcInADifferentThread(newCentroid,GroupArray[j],j);
          }
        }
        function Variable(initVal, onChange)
        {
            this.val = initVal;          //Value to be stored in this object
            this.onChange = onChange;    //OnChange handler
            //This method returns stored value
            this.GetValue = function(){
                return this.val;};
            //This method changes the value and calls the given handler
            this.SetValue = function(value){
                this.val = value;
                this.onChange();};
        }
        function findNewCentroid(transitArrayWithClusters){

          newCentroid = [];
          for(var key in transitArrayWithClusters){
            var weight = 0,dest_x = 0,dest_y = 0,orig_x = 0,orig_y = 0;
            var groupMember = transitArrayWithClusters[key];
            for(var n =0,l = groupMember.length; n<l;n++){
              if(groupMember[n][4] !==0){
                  var oldWeight = groupMember[n][4];
                  var newWeight = weight+oldWeight;
                  orig_x = (orig_x*weight+groupMember[n][0]*oldWeight)/newWeight;
                  orig_y=  (orig_y*weight+groupMember[n][1]*oldWeight)/newWeight;
                  dest_x = (dest_x*weight+groupMember[n][2]*oldWeight)/newWeight;
                  dest_y = (dest_y*weight+groupMember[n][3]*oldWeight)/newWeight;
                  weight = newWeight;
              }
            }
            newCentroid.push([orig_x,orig_y,dest_x,dest_y,weight,key]);
          }
          return newCentroid;
        }

        function outputGeojson(centroids){
          var geojson =
             {"name":"NewFeatureType",
              "type":"FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3401" } },
              "features":[]};
          for(var i = 0,k=centroids.length;i<k;i++){
            var singleRecord = {};
            singleRecord.type = "Feature";
            singleRecord.geometry={};
            singleRecord.properties= {};
            singleRecord.geometry.type = "LineString";
            singleRecord.geometry.coordinates =[[centroids[i][0],centroids[i][1]],[centroids[i][2],centroids[i][3]]];
            singleRecord.properties.weight = centroids[i][4];
            geojson.features.push(singleRecord);
          }
          return geojson;
        }
        function redrawClusters(newCentroid,graphicsLayer){
          var maxWidth = 0;
          for(var p=0,l=newCentroid.length;p<l;p++){
            if (newCentroid[p][4]>maxWidth){
                maxWidth = newCentroid[p][4];
            }
          }
          if(selectedDistrict==='all'){
                ratio = maxWidth/23;
          }
          else{
            ratio=maxWidth/12;
          }
        
          for(var j = 0,k= newCentroid.length;j<k;j++){
            var centroidWidth;
            centroidWidth = newCentroid[j][4]/ratio;
            const pointOrigin = new Point([newCentroid[j][0], newCentroid[j][1]], geoSpatialReference);
            const pointDest = new Point([newCentroid[j][2], newCentroid[j][3]], geoSpatialReference);
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);

            if(centroidWidth>0.05){
              var advSymbol = new DirectionalLineSymbol({
                  style: SimpleLineSymbol.STYLE_SOLID,
                  color: new Color([255,102, 102]),
                  width: centroidWidth,
                  directionSymbol: "arrow2",
                  directionPixelBuffer: 12,
                  directionColor: new Color([204, 51, 0]),
                  directionSize: centroidWidth*5
              });

              var polylineJson = {
                "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
              };
              var infoTemplate = new InfoTemplate("Value: ${value}");
              var advPolyline = new Polyline(polylineJson,viewSpatialReference);
              var ag = new Graphic(advPolyline, advSymbol, {indexOfGroup:newCentroid[j][5],value:newCentroid[j][4]}, infoTemplate);
              graphicsLayer.add(ag);
            }
          }
        }
        function startEndDots(line){
            var adjustedSize=line[4]*27/ratio;
            //the data has huge gap, will eliminate very small ones.

            if(adjustedSize<0.5&&adjustedSize>0.05){
              adjustedSize = 0.5;
            }
            var squareSymbol = new SimpleMarkerSymbol({
                "color":[0,0,128,128],
                "size":adjustedSize,
                "angle":0,
                "xoffset":0,
                "yoffset":0,
                "type":"esriSMS",
                "style":"esriSMSDiamond",
                "outline":{"color":[0,0,128,255],
                    "width":1,
                    "type":"esriSLS",
                    "style":"esriSLSSolid"
                }
            });

            var symbolOrigin = new SimpleMarkerSymbol({
              "color":[0,0,128,128],
              "size":adjustedSize,
              "angle":0,
              "xoffset":0,
              "yoffset":0,
              "type":"esriSMS",
              "style":"esriSMSCircle",
              "outline":{
                "color":[0,0,128,255],
                "width":1,
                "type":"esriSLS",
                "style":"esriSLSSolid"
              }
            });
            var symbolDest = new SimpleMarkerSymbol({
              "color":[255,255,0,128],
              "size":adjustedSize,
              "angle":0,
              "xoffset":0,
              "yoffset":0,
              "type":"esriSMS",
              "style":"esriSMSCircle",
              "outline":{
                "color":[255,255,0,255],
                "width":1,
                "type":"esriSLS",
                "style":"esriSLSSolid"
              }
            });

            var originPoint = new Point(line[0],line[1],geoSpatialReference);
            var destPoint = new Point(line[2],line[3],geoSpatialReference);
            var projectedPointOrigin = projection.project(originPoint, viewSpatialReference);
            var projectedPointDest = projection.project(destPoint, viewSpatialReference);
            if(line[5] === line[6]){
                var originG = new Graphic(projectedPointOrigin,squareSymbol,{},null);

                return [originG,null]
            }
            else{
                var originG = new Graphic(projectedPointOrigin, symbolOrigin, {}, null);
                var destG = new Graphic(projectedPointDest, symbolDest, {}, null);
                return [originG,destG];

            }

        }
        function startEndLines(line){
            var centroidWidth;
            centroidWidth = line[4]*4/ratio;
            const pointOrigin = new Point([line[0],line[1]], geoSpatialReference);
            const pointDest = new Point([line[2], line[3]], geoSpatialReference);
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);
            var infoTemplate = new InfoTemplate("Value: ${value}","Origin Zone: ${inZone}<br/>Destination Zone:${outZone}");

            if(centroidWidth>0.05){
                if(line[5]===line[6]){
                    var squareSymbol = new SimpleMarkerSymbol({
                        "color":[0,0,128,128],
                        "size":centroidWidth*25,
                        "angle":0,
                        "xoffset":0,
                        "yoffset":0,
                        "type":"esriSMS",
                        "style":"esriSMSDiamond",
                        "outline":{"color":[0,0,128,255],
                            "width":1,
                            "type":"esriSLS",
                            "style":"esriSLSSolid"
                        }
                    });
                    var originG = new Graphic(projectedPointOrigin,squareSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
                    return originG;
                }
                else{
                  
                  // var lineSymbol = new SimpleLineSymbol()
                  //   lineSymbol.setMarker({
                  //     style: "arrow",
                  //     placement: "end"
                  //   });
                    var advSymbol = new DirectionalLineSymbol({
                        style: SimpleLineSymbol.STYLE_SOLID,
                        color: new Color([0,0,204]),
                        width: centroidWidth,
                        directionSymbol: "arrow1",
                        directionPixelBuffer: 12,
                        directionColor: new Color([0,0,204]),
                        directionSize: centroidWidth*5
                    });
                    var polylineJson = {
                        "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
                    };
                    var advPolyline = new Polyline(polylineJson,viewSpatialReference);
                    var ag = new Graphic(advPolyline, advSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
                    return ag;
                }
            }
            else{
                return null;

            }
      
        }
        // geoJsonLayer1.on('click',function(e){
        //   console.log(e)
        // })

  });
    
function splitDataIntoTravelMatrix(uniqueTravelType,data){
  for(var i=0;i<uniqueTravelType.length;i++){
    var thisTravelType = uniqueTravelType[i];
    var dataOfThisTravelType = []
    for(var j in data){
      if(data[j].Purpose_Category === thisTravelType){
        var thisDataArray = [Number(data[j].Origin_Long),Number(data[j].Origin_Lat),Number(data[j].Dest_Long),Number(data[j].Dest_Lat),Number(data[j].Total),data[j].OriginZoneTAZ1669EETP,data[j].DestZoneTAZ1669EETP,data[j].OriginZoneDistrictTAZ1669EETP,data[j].DestZoneDistrictTAZ1669EETP]
        dataOfThisTravelType.push(thisDataArray)
      }
    }
    travelMatrix[thisTravelType] = dataOfThisTravelType;
    
    
  }
}
