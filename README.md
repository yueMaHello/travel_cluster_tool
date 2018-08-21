# Flow_Cluster_Tool/README


This is a [Nodejs](https://docs.npmjs.com/getting-started/installing-node)
web application(with some python scripts). The weighted
Kmeans algorithm is used. The important data is not
here. You should use your own
``flow_matrices_SCENARIO_YEAR_VERSION.omx`` file.

## Quickstart

```
git clone git@github.com:yueMaHello/Flow_Cluster_Tool.git
cd Flow_Cluster_Tool

source fct-setup.env

# If needed, install tools...
# (for Ubuntu)
make _apt_get_install
# (for OSX)
make _brew_install

# build our SW.
make _build_all

# run the server.
make _fct_run_server
```

Programs
--------------------------------------------------

- ``fct-run-server`` = runs the nodejs server.

- ``fct-decode-omx`` = run from top of tree, uncompresses ``./public/data/compressed``.


TODO
--------------------------------------------------

- The memory consumption around 10GiB for the test files.

- The UI should display unique values in the selector.

- The files split out of the omx files should be in their own subdir.
  When running as a container, we want a single mount point.
  
- The input omx files should not be under "public" as they are not public.

- The python files should not be under "public" either.
  Should be python-3 too.


==================================================

## Set Up

#### 1. Download the folder

#### 2. Go to the root of the folder, and run some npm commands in the terminal/cmd. If 'npm' is not found, then you may need to install nodejs first...

    1. npm install
    2. npm install --save express
    3. npm install --save Blob
    4. npm install --save child-process
    5. npm install --save http-errors
    6. npm install --save jade
    7. npm install --save jsdom
    8. npm install --save morgan
    9. npm install --save fs
    10. npm install --save socket.io
       
#### 3. Python2.7 is needed. Please use PIP to install openmatrix and numpy.

#### 4. Go to './public/data/' folder, add your 'flow_matrices_Scenario_Year_Version.omx'(name is important, must follow the format) file there. For example, 'flow_matrices_110_2018_1.omx' or 'flow_matrices_S1_2014_version4.omx' is good; however, 'flow_matrices.omx' or 'flow_matrices_110.omx' is invalid.

## Run The Application

#### 1. Use your terminal going to the root and type 'npm start'

1. You can see some messages in the terminal.

#### 2. Use Google Chrome or Firefox to browse "https://localhost:3000".

1. To extract a single .omx file needs 2-3 minutes. You can put all .omx file into './public/compressed/' folder. When the user select a omx file, the app will check whether it has been decoded. If it is not, then it will call python code to decode it in another thread. The user can still view other omx files without being blocked.

2. During decoding process, the application will create corresponding a folder './public/uncompressed/flow_data_Scenario_Year_Version/' for the omx file.For example, if the omx file is 'flow_matrices_120_2017_1', the folder created should be './public/uncompressed/flow_data_120_2017_1'.

## Current Issues:

1. Sometimes, when you zoom out very quickly, the webpage may lose all the lines. You can run the next iteration to fix it.
2. Browsing through a Chrome Box may not work.
3. If the matrix is not a flow matrix or consists some wired data, it may make the App stuck. You need to refresh the page manually. 

## Improvements:
1. There is a [Node.js HDF5 library](https://www.npmjs.com/package/hdf5) that could read the [omx matrices](https://github.com/osPlanning/omx) directly, rather than decoding them very slowly with python.  
The internal [omx file structure is documented](https://github.com/osPlanning/omx/wiki/Specification).

2. We need another arrowhead shape at the end of the line also indicating quantity, probably in a different colour. Otherwise, intrazonal flows that have zero length don't show up at all, especially after
clicking on an arrow for see the detailed lines or dots. 

## Some Tips:

1. All the lines are clickable, no matter it is a blue(single) line or red(clustered) line, but you have to click on the central of the line precisely. Clicking on the arrow won't have any effect.
2. If you choose to see single flows in 'lines', the right-side table is clickable and highlight the chosen single flow on the map.
3. If you choose to see single flows in 'dots', you can see a lot of circles showing in different sizes after clicking on a red clusted line; however, the dots are not clickable and can't be selected through the right-side table.
4. The slider can let the app run Kmeans continuously, but 20 iterations may be good enough. Don't leave it run forever(though it will stop after 200 iterations), it may occupy your cpu resource.
