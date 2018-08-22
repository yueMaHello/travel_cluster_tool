# Travel Cluster Tool


This is a [Nodejs](https://docs.npmjs.com/getting-started/installing-node)
web application(with some python scripts). The Weighted-Kmeans algorithm is used. The data is not in github.

## Set Up

### From GitHub
1. Download the folder
2. Go to the root of the folder, and run some npm commands in the terminal/cmd. If 'npm' is not found, then you may need to install nodejs first...
    * npm install
    * npm install --save express
    * npm install --save Blob
    * npm install --save child-process
    * npm install --save http-errors
    * npm install --save jade
    * npm install --save jsdom
    * npm install --save morgan
    * npm install --save fs
    * npm install --save socket.io
   
### From Lab Computer I
1. Go to the root foler './Travel_Cluster_Tool'
2. The district geojson file is stored in './public/data/geoInfo'. The csv file is './public/data/Origin_Dest_Zones_by_Trip_Purpose_3776.csv'. Please be cautious that the csv file should use EPSG3776 as Spatial reference. EPSG3776 is a local spatial reference which uses meters, but EPSG4326 is a global reference which doesn't use meters.

## Run The Application
#### 1. Use your terminal going to the root './Travel_Cluster_Tool' and type 'npm start'
1. You can see some messages in the terminal.

#### 2. Use Google Chrome or Firefox to browse "https://localhost:3036". Firefox works better than Google Chrome. 

## Current Issues:

1. Sometimes, when you zoom out very quickly, the webpage may lose all the lines. You can run the next iteration to fix it.
2. Browsing through a Chrome Box may not work. 
3. Browsing through Chrome can sometimes disable the click f the lines. If it happens, you should use control panel to terminate the Chrome App and reopen it.

## Some Tips:

1. All the lines are clickable, no matter it is a blue(single) line or red(clustered) line, but you have to click on the central of the line precisely. Clicking on the arrow won't have any effect.
2. If you choose to see single flows in 'lines', the right-side table is clickable and highlight the chosen single flow on the map.
3. If you choose to see single flows in 'dots', you can see a lot of circles showing in different sizes after clicking on a red clusted line; however, the dots are not clickable and can't be selected through the right-side table.
4. The slider can let the app run Kmeans continuously, but 20 iterations may be good enough. Don't leave it run forever(though it will stop after 200 iterations), it may occupy your cpu resource.
5. There is a set of radio buttons 'All' and 'District'. If you select 'All', then the App will cluster all the trips in Edmonton. If you select 'District', you can double click a district on the map, and the App will only cluster the trips whose destinations are within that district.
