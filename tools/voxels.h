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
    _voxels = new WeightedColor[volume];
  }
  ~Voxels() {
    delete[] _voxels;
  }
  int size() const { return _size; }
  WeightedColor& get(int x, int y, int z) {
    return _voxels[getIndex(x, y, z)];
  }
  bool hasColor(int x, int y, int z) {
    return !get(x, y, z).isTransparent();
  }
  WeightedColor getColor(int x, int y, int z) {
    return get(x, y, z);
  }
  void add(int x, int y, int z, int r, int g, int b) {
    get(x, y, z).add(r, g, b);
  }
private:
  int getIndex(int x, int y, int z) {
    return x + _size * (y + _size * z);
  }
  WeightedColor* _voxels;
  int _size;
};

#endif