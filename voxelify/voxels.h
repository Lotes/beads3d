#ifndef VOXELS_H
#define VOXELS_H

#include <iostream>
#include <cstring>
#include <string>
#include <fstream>
#include <algorithm>
#include <vector>
#include <list>
#include <sstream>
#include <math.h>
#include <ctime>
#include "color.h"

using namespace std;

class Voxels {
public:
  Voxels(int size): _size(size) {
    int volume = size*size*size;
    _voxels = new vector<Color>[volume];
  }
  ~Voxels() {
    delete[] _voxels;
  }
  int size() const { return _size; }
  vector<Color>& get(int x, int y, int z) {
    return _voxels[getIndex(x, y, z)];
  }
  bool hasColor(int x, int y, int z) {
    return get(x, y, z).size() > 0;
  }
  Color getColor(int x, int y, int z) {
    double r = 0, g = 0, b = 0;
    auto colors = get(x, y, z);
    for(auto& color: colors) {
      r += color.r;
      g += color.g;
      b += color.b;
    }
    int count = colors.size();
    return Color(
      (int)(r/count),
      (int)(g/count),
      (int)(b/count)
    );
  }
  void add(int x, int y, int z, Color color) {
    get(x, y, z).push_back(color);
  }
  string toString() {
    //compute palette and voxels color indices
    int volume = _size * _size * _size;
		vector<int> palette;
    map<int, int> indices;
    int* voxels = new int[volume];
    for(int y=0; y<_size; y++) {
      for(int z=0; z<_size; z++) {
        for(int x=0; x<_size; x++) {
          int voxelIndex = getIndex(x, y, z);
          int colorIndex = -1;
          if(hasColor(x, y, z)) {
            Color color = getColor(x, y, z);
            int rgb = color.rgb();
            auto it = indices.find(rgb);
            if(it != indices.end())
              colorIndex = it->second;
            else {
              palette.push_back(rgb);
              indices[rgb] = colorIndex = palette.size()-1;
            }
          }
          voxels[voxelIndex] = colorIndex;
        }
      }
    }
    //print out json result
    std::stringstream stream;
		stream << "{" << endl;
      //print palette
      stream << "\t\"palette\": [" << endl;
      for(int colorIndex=0; colorIndex<palette.size(); colorIndex++) {
        stream << "\t\t0x" << hex << palette[colorIndex];
        if(colorIndex < palette.size()-1)
          stream << ",";
        stream << endl; 
      }
      stream << "\t]," << endl;
      //print voxels
      stream << "\t\"voxels\": [" << endl;
      for(int y=0; y<_size; y++) {
        stream << "\t\t[" << endl;
        for(int z=0; z<_size; z++) {
          stream << "\t\t\t[";
          for(int x=0; x<_size; x++) {
            int voxelIndex = getIndex(x, y, z);
            stream << dec << voxels[voxelIndex];
            if(x<_size-1)
              stream << ", ";
          }
          stream << "]";
          if(z<_size-1)
            stream << ",";
          stream << endl;
        }
        stream << "\t\t]";
        if(y<_size-1)
          stream << ",";
        stream << endl;
      }      
      stream << "\t]" << endl;
    stream << "}" << endl;
    stream.flush();
    delete[] voxels;
    return stream.str();
	}
private:
  int getIndex(int x, int y, int z) {
    return x + _size * (y + _size * z);
  }
  vector<Color>* _voxels;
  int _size;
};

#endif