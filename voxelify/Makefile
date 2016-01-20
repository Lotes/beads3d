voxelify:
	g++ -g -ovoxelify -std=c++11 voxelify.cpp -I/usr/include -L/usr/lib -llibfreeimage -llibboost_regex -llibboost_system -llibboost_filesystem
	./voxelify "model/Venusaur.obj" 20 bisaflor.json
   
zip2obj:
	g++ -g -ozip2obj -std=c++11 zip2obj.cpp -I/usr/include -L/usr/lib -llibfreeimage -llibboost_regex -llibboost_system -llibboost_filesystem -lzip
	./zip2obj model.zip model