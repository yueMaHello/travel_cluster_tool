# Travel Cluster Tool


This is a [Nodejs](https://docs.npmjs.com/getting-started/installing-node)
web application. The Weighted-Kmeans algorithm is used for clustering. The App can show clustering results after each iteration on the map. The data used in this App is the same as the one used in Travel Circle Model; however, a clustering process is applied to show a more general view of travel flows in Edmonton by eliminating small trips.
A multi-threading method is used to speed up the K-means process. The dataset is divided into n (n is the number of threads) parts and then do distance calculation at the same time.
This application has all the features of a flow cluster tool. It can be used as a template to create other flow cluster tools.


## Set Up

#### From GitHub
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
   
#### From Lab Computer I
1. Go to the root foler './Travel_Cluster_Tool'
2. The district geojson file is stored in './public/data/geoInfo'. The geojson file has been converted to EPSG4326. 
3. The csv source file is './public/data/Origin_Dest_Zones_by_Trip_Purpose_3776.csv'. Please be cautious that the csv file should use EPSG3776 as Spatial reference. EPSG3776 is a local spatial reference which uses meters. The reason why not using EPSG4326 is that 4326 is a global reference which is not in meters. It will be unprecise if we use EPSG4326 to calculate the distance.
4. There is a './public/dataExample' folder provided.

## Run The Application
#### 1. Use your terminal going to the root './Travel_Cluster_Tool' and type 'npm start'
1. You can see some messages in the terminal.

#### 2. Use Google Chrome or Firefox to browse "https://localhost:3036" or "http://162.106.202.155:3036". Firefox may work better than Google Chrome. 

## Current Issues:
1. Sometimes, when you click on the red lines, the dots couldn't show up properly. You should close your browser and reopen it.

## Some Tips:
1. All the lines are clickable, no matter it is a blue(single) line or red(clustered) line.
2. If you choose to see single flows in 'lines', the right-side table is clickable and highlight the chosen single flow on the map.
3. If you choose to see single flows in 'dots', you can see a lot of circles showing in different sizes after clicking on a red clusted line; however, the dots are not clickable and can't be selected through the right-side table.
4. The slider can let the app run Kmeans continuously, but 20 iterations may be good enough. Don't leave it run forever(though it will stop after 200 iterations), it may occupy your cpu resource.
5. There is a set of radio buttons 'All' and 'District'. If you select 'All', then the App will cluster all the trips in Edmonton. If you select 'District', you can double click a district on the map, and the App will only cluster the trips whose destinations are within that district.
6. What is the use of 'Variable' object? It is used to monitor the condition of each thread. If all the threads has finished, the Variable object will call the onchange function to plot the result on the map. Without this method, you have no idea about when all the threads has completed. 
