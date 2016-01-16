voxelify:
	g++ -g -ovoxelify -std=c++11 main.cpp -I/usr/include -L/usr/lib -llibboost_regex
	./voxelify "../development/models/pikachu/model.obj" 10 pikachu.json
   
zip2obj:
	g++ -g -ozip2obj -std=c++11 zip2obj.cpp -I/usr/include -L/usr/lib -llibfreeimage -llibboost_regex -llibboost_system -llibboost_filesystem -lzip
	./zip2obj model.zip model