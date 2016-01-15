#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <fstream>
#include <algorithm>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>
#include "vector.h" 
#include "object.h" 
#include "voxels.h" 
#include "progress.h" 
 
using namespace std;

void voxelifyVertex(const Vector3<float>& vertex, Voxels& result) {
  int size = result.size();
  Vector3<int> coords(
    (int) (vertex.x * size),
    (int) (vertex.y * size),
    (int) (vertex.z * size)
  );
  result.set(coords.x, coords.y, coords.z, 1);
}

void voxelifyFace(const Face& face, Voxels& result) {
  float lowerBound = 0.5 / result.size();
  if(face.a.distanceTo(face.b) >= lowerBound
     || face.a.distanceTo(face.c) >= lowerBound
     || face.b.distanceTo(face.c) >= lowerBound) {
    auto subFaces = face.split();
    for(auto subFace: subFaces)
      voxelifyFace(subFace, result);
  } else {
    voxelifyVertex(face.a, result);
    voxelifyVertex(face.b, result);
    voxelifyVertex(face.c, result);
  }
}

int main(int argc, char *argv[]) {
	if(argc < 3) {
		cout << "Usage: beadify <obj file> <size> [<output file>]" << endl;
		return 1;
	}
	
	//config
	int size = atoi(argv[2]);
	char* inputFileName = argv[1];
	char* outputFileName = argc == 3 ? 0 : argv[3];
	
	//preparation
	Voxels result(size);
  Object object(inputFileName);
  object.normalize();
  
  //computation
  auto faces = object.extractFaces();
  Progress progress(faces.size(), outputFileName!=0);
  for(auto face: faces) {
    voxelifyFace(face, result); 
    progress.step();
  }
  
  //print
	if(outputFileName) {
		ofstream out(outputFileName);
		out << result.toString();
		out.close();
	}
	else
		cout << result.toString();
	return 0;
}