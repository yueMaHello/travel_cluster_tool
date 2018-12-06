/*This is a Nodejs web application. The Weighted-Kmeans algorithm is used for clustering.
The App can show clustering results after each iterations on the map.
The Kmeans process is sped up by multi-threading method in browser,
and is visualized on the map to let user clearly see the converging process.
One important thing needed to be careful is that the data has to provide lat and lng in ESRI 3776 format instead of general 4326
Since ESRI 4326 is not measured in meters and will lead to issue.
Since multi-threading and visualization after each iteration in Browser is quite complicated, the code is complex as well.
If you have to change the code, please be very careful!!!
*/

//If your csvfile's title changes, just change values in this Object.
//Don't need to change other code
let csvFileTitle = {csvFileUrl:"./data/Origin_Dest_Zones_by_Trip_Purpose_Region_3776.csv",
    origin_zone:"OriginZoneTAZ1669EETP",
    origin_district:"OriginZoneDistrictTAZ1669EETP",
    origin_x:"Origin_XCoord",
    origin_y:"Origin_YCoord",
    dest_zone:"DestZoneTAZ1669EETP",
    dest_district:"DestZoneDistrictTAZ1669EETP",
    dest_x:"Dest_XCoord",
    dest_y:"Dest_YCoord",
    weight:"Total"
};
let map;
let currentIteration = 1;//initialization
let result;
let clusterNumber=50;//initialization
let newCentroid;
let transitArray=[];
let clusters = [];
let transitArrayWithClusters = [];
let myVar;
let myCounter;
let selectedMatrix;
let ratio;
let viewSpatialReference;
let geoSpatialReference;
let geoJsonLayer1 ;
let graphicsLayer;
let startEndLayer;
let selectedDistrictLayer;
let totalWeight;
let sumOfTransitArray;
let travelMatrix={};
let selectedDistrict='district';
let connections = [];


//get esri resource
require(["esri/geometry/projection","esri/map", "esri/Color", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Polyline", "esri/geometry/Polygon", "../externalJS/DirectionalLineSymbol.js","esri/layers/FeatureLayer","../externalJS/geojsonlayer.js",
        "esri/symbols/SimpleMarkerSymbol",  "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/SpatialReference","esri/config", "esri/request",
        "dojo/ready","dojo/_base/connect", "dojo/dom", "dojo/on","esri/dijit/BasemapToggle","esri/dijit/Scalebar","esri/geometry/Point","esri/InfoTemplate",   "esri/geometry/Extent"],
    function (projection,Map, Color, GraphicsLayer, Graphic, Polyline, Polygon, DirectionalLineSymbol,FeatureLayer,GeojsonLayer,
              SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,SpatialReference, config, request,
              ready, connect,dom, on,BasemapToggle,Scalebar,Point,InfoTemplate,Extent) {
        ready(function () {
            //projection is used to transfer data between different SpatialReference
             if (!projection.isSupported()) {
               alert("client-side projection is not supported");
               return;
             }
            const projectionPromise = projection.load();
            //don't change. Always 4326 to plot
            viewSpatialReference = new SpatialReference({
              wkid: 4326
            });
            //csv data Origin_Dest_Zones_by_Trip_Purpose_3776
            geoSpatialReference = new SpatialReference({
              wkid: 3776
            });
            //show default clusterNumber
            $("#clusters").val(clusterNumber);
            $("#currentIteration").prop('disabled', true);
            $("#flowTable tr").remove();
            $("#flowTable").append('<tr><th>Travel Type Selction</th></tr>');

            d3.csv(csvFileTitle.csvFileUrl, function(data) {
              let uniqueTravelType = data.map(data => data.Purpose_Category)
                .filter((value, index, self) => self.indexOf(value) === index);

              splitDataIntoTravelMatrix(uniqueTravelType,data); 
              //dynamic fill the flowTable based on unique travel type
              uniqueTravelType.forEach(function(key){
                    $("#flowTable").append('<tr class="clickableRow2"><td>'+key+'</td></tr>');
                });
                    
                $(".clickableRow2").on("click", function() {
                  //highlight selected row
                  dojo.forEach(connections,dojo.disconnect);
                  $("#flowTable tr").removeClass("selected");
                  let rowItem = $(this).children('td').map(function () {
                      return this.innerHTML;
                  }).toArray();
                  $(this).addClass("selected");
                  selectedMatrix=rowItem[0];
                  $('#currentIteration').val(0);
                  processData(selectedMatrix,clusterNumber,1);
                  connections.push(dojo.connect(geoJsonLayer1, 'onDblClick', MouseClickhighlightGraphic));

              });
            });
            //range sliders
            $("#clusterRange").change(function(){
              $("#clusters").val(this.value);
            });
            $("#threadRange").change(function(){
              $("#threadNumber").val(this.value);
            });
            //map initialization
            map = new Map("map", {
                center: [-113.4947, 53.5437],
                zoom: 10,
                basemap: "gray",
                minZoom: 3
            });
            //map toggle
            let toggle = new BasemapToggle({
               map: map,
               basemap: "streets"
             }, "viewDiv");
            toggle.startup();
            //add geojson district layer
            map.on("load", function () {
              geoJsonLayer1 = new GeojsonLayer({
                 url:"../data/geoInfo/district1669.geojson",
                  id:"geoJsonLayer"
             });
             map.disableDoubleClickZoom();
             geoJsonLayer1.setInfoTemplate(false);
             map.addLayer(geoJsonLayer1);
            });  
            //get notification if radio buttons are clicked
            $('input:radio[name=allOrDistrict]').change(function() {
              //cluster all districts
              if(this.value==='all'){
                map.removeLayer(selectedDistrictLayer);
                dojo.forEach(connections,dojo.disconnect);
                selectedDistrict = 'all';
                processData(selectedMatrix,clusterNumber,1);

              }
              //cluster single destination district
              else{
                connections.push(dojo.connect(geoJsonLayer1, 'onDblClick', MouseClickhighlightGraphic));
              }
            });
            //cluster data when clicking on a district zone
            function MouseClickhighlightGraphic(evt){
              map.removeLayer(selectedDistrictLayer);
              selectedDistrictLayer = new GraphicsLayer({ id: "selectedDistrictLayer" });
              selectedDistrict=evt.graphic.attributes.District;

              let highlightSymbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                  SimpleLineSymbol.STYLE_SOLID,
                  new Color([0,225,225]), 2
                ),
                new Color([0,225,225,0.5])
              );              
              let graphic = new Graphic(evt.graphic.geometry, highlightSymbol);
              selectedDistrictLayer.add(graphic);
              map.addLayer(selectedDistrictLayer);
              processData(selectedMatrix,clusterNumber,1);
              $("#currentIteration").val("0");
            }
            //disable the map navigation when loading data
            on(map, "update-start", showLoading);
            //enable the map navigation when finish loading
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
            selectedDistrictLayer = new GraphicsLayer({ id: "selectedDistrictLayer" });

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
            //myVar use the self-defined Variable as its type
            //It has a initial value:10. Actually, the number does nothing.
            //If myVar.SetValue(...) is called, then the function() wrote in myVar will be called. 
            //myVar is like a monitor monitoring the Kmeans process
            //After each iteration of Kmeans, myVar will change the Map
            myVar = new Variable(10, function(){
                  //clean the map
                  map.removeLayer(graphicsLayer);
                  map.removeLayer(startEndLayer);
                  graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
                  //readd the clustered lines
                  map.addLayer(graphicsLayer);
                  //each clusted line should have a group of single lines
                  connect.connect(graphicsLayer,"onClick",function(evt){
                    let clickedGroup = evt.graphic.attributes.index||evt.graphic.symbol.index;
                    if(typeof(clickedGroup)!=="undefined"){
                      map.removeLayer(startEndLayer);
                      startEndLayer = new GraphicsLayer({ id: "startEndLayer" });
                      //draw dots
                      if($("#dots").is(':checked') === true){
                        for (let h =0;h<transitArrayWithClusters[clickedGroup].length;h++){
                          let orginDest = startEndDots(transitArrayWithClusters[clickedGroup][h]);
                          startEndLayer.add(orginDest[0]);
                          if(orginDest[1]!==null){
                              startEndLayer.add(orginDest[1]);

                          }
                        }
                      }
                      //draw lines
                      else if($("#lines").is(':checked') === true){
                        for (let h2 =0;h2<transitArrayWithClusters[clickedGroup].length;h2++){
                          let line = transitArrayWithClusters[clickedGroup][h2];
                          let ag = startEndLines(line);
                          if(ag !== null){
                            startEndLayer.add(ag);
                          }
                        }
  
                       }
                       else{
                         alert("Some error happens, please try to refresh the page!");
                       }
                      map.addLayer(startEndLayer);
                      if($("#lines").is(':checked') === true){
                        $(".clickableRow").on("click", function() {
                          for(let p=0,m =startEndLayer.graphics.length;p<m;p++){

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
                  
                  if(myVar.GetValue() === 1){
                      currentIteration = Number($('#currentIteration').val())+1;
                      $('#currentIteration').val(currentIteration);
                  }
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
            //run nextIteration
            $("#nextIteration").click(function(){
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              map.disableMapNavigation();
              map.hideZoomSlider();
              result = splitIntoGroups();
            });
            //run autoRun
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
            //generate geojson file
            $("#WantJson").click(function(){
              let outputGeoJsonFile = outputGeojson(newCentroid);
              let data = JSON.stringify(outputGeoJsonFile,undefined,4);
              let blob = new Blob([data], {type: 'text/json'}),
                  a    = document.createElement('a');
              a.download = "geojson1.geojson";
              a.href = window.URL.createObjectURL(blob);
              a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
              a.innerHTML = 'Download JSON';
              a.click();
            });
            //Rerun kmeans
            $("#RerunButton").click(function(){
                $("#currentIteration").val("0");
                clusterNumber =Number($("#clusters").val());
                processData(selectedMatrix,clusterNumber,1);                  
            });
            //process kmeans 
            function processData(selectedMatrix,clusterNumber,iteration) {

              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              //kmeans initialization. This is different from traditional Kmeans. 
              //It gives a higher possibility to lines with a higher weight to be choosen as a initial cluster center
              //the algorithm is based on https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
              if(selectedDistrict==='all'){
                totalWeight=0;
                transitArray = travelMatrix[selectedMatrix];
                for(let i = 0, l = transitArray.length; i<l;i++){
                  totalWeight += transitArray[i][4];
                }
              }
              else{
                totalWeight=0;
                transitArray = [];
                for(let d in travelMatrix[selectedMatrix]){
              // console.log(selectedDistrict)
                  if(Number(travelMatrix[selectedMatrix][d][8]) === Number(selectedDistrict)){
                    transitArray.push(travelMatrix[selectedMatrix][d]);
                  }
                }
                if(!selectedMatrix){
                  alert("You haven't select any travel type!");
                }
                else if(selectedDistrict ==='district'){
                  
                    alert('Please double click on a zone!');
                }
                else if(transitArray.length ===0){
                
                  alert('No travel in this zone!');
                  return;
                }
                for(let i = 0, l = transitArray.length; i<l;i++){
                  totalWeight += transitArray[i][4];
                }
              }    
              //initialization
              let totalTransitLength = transitArray.length;
              let currentSum = 0;
              sumOfTransitArray = new Array(transitArray.length);
              for(let r = 0;r<totalTransitLength;r++){
                currentSum+=transitArray[r][4];
                sumOfTransitArray[r] = currentSum;
              }        
              if(transitArray.length<clusterNumber){
                newCentroid= transitArray;
              }
              else{
                newCentroid= new Array(clusterNumber);    
                for(let i2 = 0;i2<newCentroid.length;i2++){
                    let randomWeight = Math.floor(Math.random()*(totalWeight));
                    for (let i3=0;i3<totalTransitLength;i3++){
                        if(sumOfTransitArray[i3]>=randomWeight && newCentroid.indexOf(transitArray[i3])< 0) {
                            newCentroid[i2] = transitArray[i3];
                            break;
                        }
                    }
                }
                //delete empty center
                newCentroid =newCentroid.filter(function(n){ return n;});
              }
              if(transitArray.length>0){
                  result = splitIntoGroups();
              }
            
              }
        });
        //calculate the distance between each line and each cluster center.
        //split lines into n cluster groups
        function splitIntoGroups(){
          transitArrayWithClusters=[];
          for(let m=0,l=newCentroid.length;m<l;m++){
            transitArrayWithClusters[JSON.stringify(m)] = [];
          }
          //multithread calculation
          let num_threads = Number($("#threadNumber").val());
          let c = 0;
          let MT = new Multithread(num_threads);
          //in each thread
          let funcInADifferentThread = MT.process(
            function(newCentroid,transitArray,index){
              
              let result = new Array(transitArray.length);
              for(let i=0,l1=transitArray.length;i<l1;i++){

                let group = 0;
                let minDist =  Number.POSITIVE_INFINITY;
                for(let j = 0,l2=newCentroid.length;j<l2;j++){
                  // coordinate distance
                  let currentDist=Math.sqrt(
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
            //result after the thread finishing calculation
            function(r) {
              //c is counter to count how many threads have finished
              c+=1;
              for(let t4=0;t4<GroupArray[r[0]].length;t4++){
                //fill the transitArrayWithClusters array
                transitArrayWithClusters[JSON.stringify(r[1][t4])].push(GroupArray[r[0]][t4]);
              }
              if(c=== num_threads){
                  //all threads have finished
                  newCentroid = findNewCentroid(transitArrayWithClusters);
                  //call function stored in myVar
                  myVar.SetValue(1);
              }
            }
          );
          //split the array into 'num_threads' groups
          let averageLength = transitArray.length/num_threads;
          let GroupArray = new Array(num_threads);

          for(let i = 0; i<num_threads; i++){
            GroupArray[i] = transitArray.slice(averageLength*i,averageLength*(i+1));
          }
          //call each threads
          for(let j=0; j<num_threads;j++){
             funcInADifferentThread(newCentroid,GroupArray[j],j);
          }
        }
        //after spliting into groups, calculate the new center for each group
        function findNewCentroid(transitArrayWithClusters){
          newCentroid = [];
          for(let key=0;key<transitArrayWithClusters.length;key++){
            let weight = 0,dest_x = 0,dest_y = 0,orig_x = 0,orig_y = 0;
            let groupMember = transitArrayWithClusters[key];
            for(var n =0,l = groupMember.length; n<l;n++){
              if(groupMember[n][4] !==0){
                  let oldWeight = groupMember[n][4];
                  let newWeight = weight+oldWeight;
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
        //generate geojson file which can be used in QGIS
        function outputGeojson(centroids){
          let geojson =
             {"name":"NewFeatureType",
              "type":"FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3401" } },
              "features":[]};
          for(let i = 0,k=centroids.length;i<k;i++){
            let singleRecord = {};
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
        //renew the map
        function redrawClusters(newCentroid,graphicsLayer){
          let maxWidth = 0;
          for(let p=0,l=newCentroid.length;p<l;p++){
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
          if(ratio<15){
              ratio = 15

          }
          for(let j = 0,k= newCentroid.length;j<k;j++){
            let centroidWidth;
            centroidWidth = newCentroid[j][4]/ratio;
            //convert geo position between different EPSG
            //EPSG3776 can't plot on the map directly, needing to be converted to EPSG4326
            const pointOrigin = new Point([newCentroid[j][0], newCentroid[j][1]], geoSpatialReference);
            const pointDest = new Point([newCentroid[j][2], newCentroid[j][3]], geoSpatialReference);
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);
            //eliminate small lines which width <0.05
            if(centroidWidth>0.05){
              let advSymbol = new DirectionalLineSymbol({
                  style: SimpleLineSymbol.STYLE_SOLID,
                  color: new Color([255,102, 102]),
                  width: centroidWidth,
                  index:newCentroid[j][5],
                  directionSymbol: "arrow2",
                  directionPixelBuffer: 12,
                  directionColor: new Color([204, 51, 0]),
                  directionSize: centroidWidth*5
              });

              let polylineJson = {
                "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
              };
              let infoTemplate = new InfoTemplate("Value: ${value}");
              let advPolyline = new Polyline(polylineJson,viewSpatialReference);
              let ag = new Graphic(advPolyline, advSymbol, {value:newCentroid[j][4]}, infoTemplate);
              graphicsLayer.add(ag);
            }
          }
        }
        //if user select 'dots' to observe
        function startEndDots(line){
            //it will adjust the size based on current dataset automatically
            let adjustedSize=line[4]*25/ratio;
            //the data has huge gap, will eliminate very small ones.

            if(adjustedSize<0.5&&adjustedSize>0.05){
              adjustedSize = 0.5;
            }
            let squareSymbol = new SimpleMarkerSymbol({
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

            let symbolOrigin = new SimpleMarkerSymbol({
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
            let symbolDest = new SimpleMarkerSymbol({
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

            let originPoint = new Point(line[0],line[1],geoSpatialReference);
            let destPoint = new Point(line[2],line[3],geoSpatialReference);
            let projectedPointOrigin = projection.project(originPoint, viewSpatialReference);
            let projectedPointDest = projection.project(destPoint, viewSpatialReference);
            if(line[5] === line[6]){
                let originG = new Graphic(projectedPointOrigin,squareSymbol,{},null);

                return [originG,null]
            }
            else{
                let originG = new Graphic(projectedPointOrigin, symbolOrigin, {}, null);
                let destG = new Graphic(projectedPointDest, symbolDest, {}, null);
                return [originG,destG];
            }

        }
        //if user select 'lines' to observe
        function startEndLines(line){
            let centroidWidth;
            centroidWidth = line[4]*4/ratio;
            const pointOrigin = new Point([line[0],line[1]], geoSpatialReference);
            const pointDest = new Point([line[2], line[3]], geoSpatialReference);
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);
            let infoTemplate = new InfoTemplate("Value: ${value}","Origin Zone: ${inZone}<br/>Destination Zone:${outZone}");

            if(centroidWidth*8>0.7){
                if(line[5]===line[6]){
                    let squareSymbol = new SimpleMarkerSymbol({
                        "color":[0,0,128,128],
                        "size":centroidWidth*6,
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

                    return new Graphic(projectedPointOrigin,squareSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
                }
                else{

                    let advSymbol = new DirectionalLineSymbol({
                        style: SimpleLineSymbol.STYLE_SOLID,
                        color: new Color([0,0,204]),
                        width: centroidWidth/2,
                        directionSymbol: "arrow1",
                        directionPixelBuffer: 12,
                        directionColor: new Color([0,0,204]),
                        directionSize: centroidWidth*2.5
                    });
                    let polylineJson = {
                        "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
                    };
                    let advPolyline = new Polyline(polylineJson,viewSpatialReference);
                    return new Graphic(advPolyline, advSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
                }
            }
            else{
                return null;
            }
        }
  });
//split csv file into several matrices based on travelpurpose    
function splitDataIntoTravelMatrix(uniqueTravelType,data){
  for(let i=0;i<uniqueTravelType.length;i++){
    let thisTravelType = uniqueTravelType[i];
    let dataOfThisTravelType = [];
    for(let j=0;j<data.length;j++){

      if(data[j].Purpose_Category === thisTravelType){
        let thisDataArray = [Number(data[j][csvFileTitle.origin_x]),Number(data[j][csvFileTitle.origin_y]),Number(data[j][csvFileTitle.dest_x]),Number(data[j][csvFileTitle.dest_y]),Number(data[j][csvFileTitle.weight]),data[j][csvFileTitle.origin_zone],data[j][csvFileTitle.dest_zone],data[j][csvFileTitle.origin_district],data[j][csvFileTitle.dest_district]];
        dataOfThisTravelType.push(thisDataArray);
      }
    }
    travelMatrix[thisTravelType] = dataOfThisTravelType;
  }
}
//this is a self defined Varaible
//If the Varaible's name is changed, then it will call the onChange function.
//you can treat it as a monitor
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
