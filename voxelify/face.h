#ifndef FACE_H
#define FACE_H

#include "vertex.h"
#include <vector>
#include <string>

using namespace std;

class Face {
public:
  Vertex a;
  Vertex b;
  Vertex c;

  Face(const char* materialName, const Vertex& a, const Vertex& b, const Vertex& c) : _materialName(materialName), a(a), b(b), c(c) {}
  
  const char* material() const { return _materialName.c_str(); }
  
  vector<Face> split() const {
    vector<Face> result;
    Vertex ab = a.lerp(b, 0.5f);
    Vertex bc = b.lerp(c, 0.5f);
    Vertex ac = a.lerp(c, 0.5f);
    result.push_back(Face(_materialName.c_str(), a, ab, ac));
    result.push_back(Face(_materialName.c_str(), b, ab, bc));
    result.push_back(Face(_materialName.c_str(), c, bc, ac));
    result.push_back(Face(_materialName.c_str(), ab, bc, ac));
    return result;
  }
private:
  string _materialName;
}; 

#endif