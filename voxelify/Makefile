cygwin:
	g++ -g -ovoxelify -std=c++11 main.cpp -I/usr/include -L/usr/lib -llibboost_regex
	./voxelify "../development/models/pikachu/model.obj" 10 pikachu.json
   
tga:
	g++ -g -otga2png -std=c++11 tga2png.cpp -I/usr/include -L/usr/lib -llibfreeimage
	./tga2png example.tga example.png