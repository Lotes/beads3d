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

using namespace std;

class Voxels {
public:
  Voxels(int size): _size(size) {
    int volume = size*size*size;
    bits = new bool[volume];
    memset(bits, 0, volume);
  }
  ~Voxels() {
    delete[] bits;
  }
  int size() const { return _size; }
  bool get(int x, int y, int z) {
    return bits[getIndex(x, y, z)];
  }
  void set(int x, int y, int z, bool value) {
    bits[getIndex(x, y, z)] = value;
  }
  string toString() {
		std::stringstream stream;
		stream << "[" << endl;
    for(int y=0; y<_size; y++) {
      stream << "\t[" << endl;
      for(int z=0; z<_size; z++) {
        stream << "\t\t\"";
        for(int x=0; x<_size; x++) {
          int index = getIndex(x, y, z);
          stream << (bits[index] ? "X" : " ");
        }
        stream << "\"";
        if(z<_size-1)
          stream << ",";
        stream << endl;
      }
      stream << "\t]";
      if(y<_size-1)
        stream << ",";
      stream << endl;
    }
    stream << "]" << endl;
    stream.flush();
		return stream.str();
	}
private:
  int getIndex(int x, int y, int z) {
    return x + _size * (y + _size * z);
  }
  bool* bits;
  int _size;
};

#endif