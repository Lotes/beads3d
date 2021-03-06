#include <iostream>
#include <cstring>
#include <string>
#include <boost/regex.hpp>
#include <boost/filesystem.hpp>
#include <fstream>
#include <algorithm>
#include <vector>
#include <map>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>
#include "vector.h" 
#include "object.h" 
#include "voxels.h" 
#include "progress.h" 
#include "material.h" 
#include <FreeImage.h>
 
using namespace std;

void save(Voxels* voxels, char* fileName) {
  int size = voxels->size();
  int width = size * size;
  FIBITMAP* bitmap = FreeImage_Allocate(width, size, 32);
  FreeImage_SetTransparent(bitmap, true);
  if(bitmap) {
    for(int y=0; y<size; y++)
    for(int x=0; x<size; x++)
    for(int z=0; z<size; z++) {
      auto color = voxels->get(x, y, z);
      RGBQUAD pixel;
      pixel.rgbRed = color.r();
      pixel.rgbGreen = color.g();
      pixel.rgbBlue = color.b();
      pixel.rgbReserved = color.isTransparent() ? 0 : 255;
      FreeImage_SetPixelColor(bitmap, x + y*size, z, &pixel);  
    }
    FreeImage_Save(FIF_PNG, bitmap, fileName, 0);
    FreeImage_Unload(bitmap);
  }
}

void voxelifyVertex(FIBITMAP* image, const Vertex& vertex, Voxels& result) {
  int size = result.size();
  Vector3<int> coords(
    (int) (vertex.x * size),
    (int) (vertex.y * size),
    (int) (vertex.z * size)
  );
  if(image) {
    RGBQUAD color;
    int width = FreeImage_GetWidth(image);
    int height = FreeImage_GetHeight(image);
    int x = (int)((width-1) * vertex.u);
    int y = (int)((height-1) * vertex.v);
    FreeImage_GetPixelColor(image, x, y, &color);  
    result.add(coords.x, coords.y, coords.z, color.rgbRed, color.rgbGreen, color.rgbBlue);
  }
}

void voxelifyFace(const map<string, FIBITMAP*>& materials, const Face& face, Voxels& result) {
  float lowerBound = 0.5 / result.size();
  if(face.a.distanceTo(face.b) >= lowerBound
     || face.a.distanceTo(face.c) >= lowerBound
     || face.b.distanceTo(face.c) >= lowerBound) {
    auto subFaces = face.split();
    for(auto subFace: subFaces)
      voxelifyFace(materials, subFace, result);
  } else {
    auto materialName = face.material();
    FIBITMAP* image = 0;
    auto it = materials.find(materialName);
    if(it != materials.end())
      image = it->second;
    voxelifyVertex(image, face.a, result);
    voxelifyVertex(image, face.b, result);
    voxelifyVertex(image, face.c, result);
  }
}

map<string, FIBITMAP*> loadTextures(const vector<Material>& libraries) {
  map<string, FIBITMAP*> result;
  for(auto& library: libraries) {
    path libraryFolder(library.fileName());
    libraryFolder.remove_leaf();
    for(auto& materialName: library.getMaterialNames()) {
      if(result.find(materialName) != result.end())
        continue;
      auto textures = library.getTextures(materialName);
      auto it = textures.find("map_Kd");
      if(it == textures.end())
        continue;
      path imagePath = libraryFolder;
      auto relative = it->second;
      boost::replace_all(relative, "\\", "/");
      imagePath /= relative;
      auto handle = FreeImage_Load(FIF_PNG, imagePath.string().c_str(), PNG_DEFAULT);
      handle = FreeImage_ConvertTo32Bits(handle);
      result[materialName] = handle;
    }
  }
  return result;
}

int main(int argc, char *argv[]) {
	if(argc < 4) {
		cout << "Usage: voxelify <obj file> <size> <output file>" << endl;
		return 1;
	}
	
	//config
	int size = atoi(argv[2]);
	char* inputFileName = argv[1];
	char* outputFileName = argv[3];
	
	//preparation
	Voxels result(size);
  Object object(inputFileName);
  object.normalize();
  vector<Material> libraries;
  path folder(inputFileName);
  folder.remove_leaf();
  for(auto libraryPath: object.libraries()) {
    path output = folder;
    output /= libraryPath;
    libraries.push_back(Material(output.string().c_str()));
  }
  auto materials = loadTextures(libraries);
  
  //computation
  auto faces = object.extractFaces();
  Progress progress(faces.size(), false); //outputFileName!=0
  for(auto face: faces) {
    voxelifyFace(materials, face, result); 
    progress.step();
  }
  
  //print
  save(&result, outputFileName);;
	return 0;
}